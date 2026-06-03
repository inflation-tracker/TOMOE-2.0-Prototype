-- ═══════════════════════════════════════════════════════════════
-- TOMOE 2.0 — PostgreSQL + TimescaleDB Schema
-- ═══════════════════════════════════════════════════════════════

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ─── Domain A: Master Data ──────────────────────────────────────

CREATE TABLE regions (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(10) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('provinsi', 'kota', 'kabupaten')),
    parent_id   INTEGER REFERENCES regions(id),
    latitude    DECIMAL(9,6),
    longitude   DECIMAL(9,6),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commodities (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50),
    unit        VARCHAR(20),
    is_volatile BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE markets (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    source      VARCHAR(50) CHECK (source IN ('PIHPS', 'BPS', 'manual')),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Domain B: Time-Series (TimescaleDB Hypertables) ────────────

CREATE TABLE commodity_prices (
    time            TIMESTAMPTZ NOT NULL,
    commodity_id    INTEGER REFERENCES commodities(id),
    market_id       INTEGER REFERENCES markets(id),
    price           DECIMAL(12,2) NOT NULL CHECK (price > 0),   -- DQ defense-in-depth
    price_change    DECIMAL(12,2),
    source          VARCHAR(50),
    PRIMARY KEY (time, commodity_id, market_id)
);

SELECT create_hypertable('commodity_prices', 'time', if_not_exists => TRUE);

CREATE INDEX idx_commodity_prices_commodity ON commodity_prices (commodity_id, time DESC);
CREATE INDEX idx_commodity_prices_market ON commodity_prices (market_id, time DESC);

CREATE TABLE inflation_index (
    time        TIMESTAMPTZ NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    component   VARCHAR(50) CHECK (component IN ('umum', 'volatile', 'core', 'administered')),
    ihk         DECIMAL(10,4),
    mtm         DECIMAL(8,4),
    yoy         DECIMAL(8,4),
    ytd         DECIMAL(8,4),
    PRIMARY KEY (time, region_id, component)
);

SELECT create_hypertable('inflation_index', 'time', if_not_exists => TRUE);

CREATE TABLE inflation_by_group (
    time        TIMESTAMPTZ NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    group_name  VARCHAR(150) NOT NULL,
    ihk         DECIMAL(10,4),
    mtm         DECIMAL(8,4),
    yoy         DECIMAL(8,4),
    andil_mtm   DECIMAL(8,4),
    PRIMARY KEY (time, region_id, group_name)
);

SELECT create_hypertable('inflation_by_group', 'time', if_not_exists => TRUE);

-- ─── Domain C: ML Output ───────────────────────────────────────

CREATE TABLE forecasts (
    id              BIGSERIAL PRIMARY KEY,
    region_id       INTEGER REFERENCES regions(id),
    commodity_id    INTEGER REFERENCES commodities(id),
    component       VARCHAR(50),
    model           VARCHAR(30) CHECK (model IN ('SARIMA', 'LSTM', 'Ensemble', 'Prophet')),
    forecast_date   TIMESTAMPTZ NOT NULL,
    run_at          TIMESTAMPTZ DEFAULT now(),
    predicted       DECIMAL(10,4) NOT NULL,
    lower_bound     DECIMAL(10,4),
    upper_bound     DECIMAL(10,4),
    mape            DECIMAL(6,3),
    params          JSONB
);

CREATE INDEX idx_forecasts_region_date ON forecasts (region_id, forecast_date);
CREATE INDEX idx_forecasts_commodity ON forecasts (commodity_id, forecast_date);

CREATE TABLE topics (
    id          SERIAL PRIMARY KEY,
    label       VARCHAR(150),
    keywords    TEXT[],
    doc_count   INTEGER,
    period      DATE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sentiment_scores (
    id              BIGSERIAL PRIMARY KEY,
    time            TIMESTAMPTZ NOT NULL,
    source_url      TEXT,
    source_type     VARCHAR(30) CHECK (source_type IN ('news', 'twitter', 'instagram', 'other')),
    commodity_id    INTEGER REFERENCES commodities(id),
    region_id       INTEGER REFERENCES regions(id),
    text_snippet    TEXT,
    sentiment       VARCHAR(10) CHECK (sentiment IN ('positif', 'netral', 'negatif')),
    score           DECIMAL(5,4),
    confidence      DECIMAL(5,4),
    topic_id        INTEGER REFERENCES topics(id)
);

CREATE INDEX idx_sentiment_time ON sentiment_scores (time DESC);
CREATE INDEX idx_sentiment_commodity ON sentiment_scores (commodity_id, time DESC);

-- ─── Domain D: Early Warning System ────────────────────────────

CREATE TABLE ews_alerts (
    id              BIGSERIAL PRIMARY KEY,
    triggered_at    TIMESTAMPTZ DEFAULT now(),
    region_id       INTEGER REFERENCES regions(id),
    commodity_id    INTEGER REFERENCES commodities(id),
    alert_type      VARCHAR(40) CHECK (alert_type IN ('2sigma', 'forecast_breach', 'sentiment_spike')),
    severity        VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high')),
    actual_value    DECIMAL(12,4),
    threshold       DECIMAL(12,4),
    message         TEXT,
    status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    metadata        JSONB
);

CREATE INDEX idx_ews_status ON ews_alerts (status, triggered_at DESC);
CREATE INDEX idx_ews_region ON ews_alerts (region_id, triggered_at DESC);

-- ─── Domain E: Auth & Audit ────────────────────────────────────

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,
    name          VARCHAR(100),
    role          VARCHAR(30) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'tpid', 'viewer')),
    region_id     INTEGER REFERENCES regions(id),
    -- PBKDF2-SHA256 hash: pbkdf2$sha256$<iters>$<salt_b64>$<key_b64>. Never store plaintext.
    password_hash VARCHAR(255),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    last_login    TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    action      VARCHAR(100),
    entity      VARCHAR(50),
    entity_id   BIGINT,
    detail      JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity, created_at DESC);

-- ─── Domain F: TimescaleDB Lifecycle ───────────────────────────
-- Without these, hypertables grow unbounded and "latest price" scans get
-- slower forever. Compression shrinks old chunks; a continuous aggregate
-- pre-computes the daily last price so the dashboard query is O(commodities)
-- instead of a full hypertable scan.

-- Columnar compression for chunks older than 30 days.
ALTER TABLE commodity_prices SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'commodity_id, market_id',
    timescaledb.compress_orderby   = 'time DESC'
);
SELECT add_compression_policy('commodity_prices', INTERVAL '30 days', if_not_exists => TRUE);

-- Retention: keep 10 years of raw prices (generous for inflation history).
SELECT add_retention_policy('commodity_prices', INTERVAL '10 years', if_not_exists => TRUE);

-- Daily continuous aggregate: last price per commodity/market per day.
-- NOTE: must run outside an explicit transaction block; the docker init runner
-- executes statements individually so this is fine on a fresh DB.
CREATE MATERIALIZED VIEW IF NOT EXISTS commodity_prices_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    commodity_id,
    market_id,
    last(price, time)        AS price,
    last(price_change, time) AS price_change
FROM commodity_prices
GROUP BY bucket, commodity_id, market_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('commodity_prices_daily',
    start_offset => INTERVAL '7 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);
