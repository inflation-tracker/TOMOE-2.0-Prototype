-- ═══════════════════════════════════════════════════════════════
-- TOMOE 2.0 — Plain PostgreSQL Schema (Railway/Vercel demo)
-- ═══════════════════════════════════════════════════════════════
-- Use this when the managed Postgres provider does NOT support TimescaleDB.
-- Production/time-series deployments should prefer db/schema.sql.

-- ─── Domain A: Master Data ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS regions (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(10) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('provinsi', 'kota', 'kabupaten')),
    parent_id   INTEGER REFERENCES regions(id),
    latitude    DECIMAL(9,6),
    longitude   DECIMAL(9,6),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commodities (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50),
    unit        VARCHAR(20),
    is_volatile BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS markets (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    source      VARCHAR(50) CHECK (source IN ('PIHPS', 'BPS', 'manual')),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (name, region_id)
);

-- ─── Domain B: Time-Series Data ─────────────────────────────────

CREATE TABLE IF NOT EXISTS commodity_prices (
    time            TIMESTAMPTZ NOT NULL,
    commodity_id    INTEGER REFERENCES commodities(id),
    market_id       INTEGER REFERENCES markets(id),
    price           DECIMAL(12,2) NOT NULL CHECK (price > 0),
    price_change    DECIMAL(12,2),
    source          VARCHAR(50),
    PRIMARY KEY (time, commodity_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_commodity
    ON commodity_prices (commodity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_market
    ON commodity_prices (market_id, time DESC);

CREATE TABLE IF NOT EXISTS inflation_index (
    time        TIMESTAMPTZ NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    component   VARCHAR(50) CHECK (component IN ('umum', 'volatile', 'core', 'administered')),
    ihk         DECIMAL(10,4),
    mtm         DECIMAL(8,4),
    yoy         DECIMAL(8,4),
    ytd         DECIMAL(8,4),
    PRIMARY KEY (time, region_id, component)
);

CREATE INDEX IF NOT EXISTS idx_inflation_index_region
    ON inflation_index (region_id, time DESC);

CREATE TABLE IF NOT EXISTS inflation_by_group (
    time        TIMESTAMPTZ NOT NULL,
    region_id   INTEGER REFERENCES regions(id),
    group_name  VARCHAR(150) NOT NULL,
    ihk         DECIMAL(10,4),
    mtm         DECIMAL(8,4),
    yoy         DECIMAL(8,4),
    andil_mtm   DECIMAL(8,4),
    PRIMARY KEY (time, region_id, group_name)
);

CREATE INDEX IF NOT EXISTS idx_inflation_by_group_region
    ON inflation_by_group (region_id, time DESC);

-- ─── Domain C: ML Output ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecasts (
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

CREATE INDEX IF NOT EXISTS idx_forecasts_region_date
    ON forecasts (region_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecasts_commodity
    ON forecasts (commodity_id, forecast_date);

CREATE TABLE IF NOT EXISTS topics (
    id          SERIAL PRIMARY KEY,
    label       VARCHAR(150),
    keywords    TEXT[],
    doc_count   INTEGER,
    period      DATE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topics_period_label
    ON topics (period, label);

CREATE TABLE IF NOT EXISTS sentiment_scores (
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

CREATE INDEX IF NOT EXISTS idx_sentiment_time
    ON sentiment_scores (time DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_commodity
    ON sentiment_scores (commodity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_source_url
    ON sentiment_scores (source_url);

-- ─── Domain D: Early Warning System ────────────────────────────

CREATE TABLE IF NOT EXISTS ews_alerts (
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

CREATE INDEX IF NOT EXISTS idx_ews_status
    ON ews_alerts (status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ews_region
    ON ews_alerts (region_id, triggered_at DESC);

-- ─── Domain E: Auth & Audit ────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,
    name          VARCHAR(100),
    role          VARCHAR(30) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'tpid', 'viewer')),
    region_id     INTEGER REFERENCES regions(id),
    password_hash VARCHAR(255),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    last_login    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    action      VARCHAR(100),
    entity      VARCHAR(50),
    entity_id   BIGINT,
    detail      JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user
    ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity
    ON audit_logs (entity, created_at DESC);
