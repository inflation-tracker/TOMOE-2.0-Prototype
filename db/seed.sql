-- ═══════════════════════════════════════════════════════════════
-- TOMOE 2.0 — Deterministic Demo Seed
-- ═══════════════════════════════════════════════════════════════
-- Contract: docs/DATA-CONTRACT.md
-- Scope   : Sulawesi Tengah demo data, stable across re-seeds.
--
-- Coverage:
--   * 1 province + 13 kab/kota
--   * 11 commodities, 5 markets
--   * 90 days of daily commodity prices
--   * 24 months of inflation index
--   * 12 months of inflation-by-group
--   * 7/14/30-day forecasts for priority commodities
--   * 60 sentiment documents + 5 topics
--   * 5 EWS alerts across status/severity

BEGIN;

-- ─── Master: Regions ────────────────────────────────────────────
INSERT INTO regions (code, name, type, parent_id, latitude, longitude) VALUES
('7200', 'Sulawesi Tengah', 'provinsi', NULL, -1.4300, 121.4456)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

INSERT INTO regions (code, name, type, parent_id, latitude, longitude) VALUES
('7271', 'Kota Palu', 'kota', (SELECT id FROM regions WHERE code='7200'), -0.9003, 119.8779),
('7201', 'Banggai', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.6000, 123.0000),
('7202', 'Banggai Kepulauan', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.6536, 123.3333),
('7203', 'Morowali', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -2.9000, 122.0000),
('7204', 'Poso', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.3958, 120.7551),
('7205', 'Donggala', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -0.7956, 119.7368),
('7206', 'Toli-Toli', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), 1.0556, 120.8148),
('7207', 'Buol', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), 0.9783, 121.4278),
('7208', 'Parigi Moutong', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -0.6280, 120.1887),
('7209', 'Tojo Una-Una', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.5820, 121.6250),
('7210', 'Sigi', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.3100, 120.0000),
('7211', 'Banggai Laut', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -1.7900, 123.4900),
('7212', 'Morowali Utara', 'kabupaten', (SELECT id FROM regions WHERE code='7200'), -2.2000, 121.6000)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    parent_id = EXCLUDED.parent_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- ─── Master: Commodities ────────────────────────────────────────
INSERT INTO commodities (code, name, category, unit, is_volatile) VALUES
('BERAS_PREM', 'Beras Premium', 'Bahan Makanan', 'kg', false),
('CABAI_MERAH', 'Cabai Merah Keriting', 'Bahan Makanan', 'kg', true),
('BAWANG_MRH', 'Bawang Merah', 'Bahan Makanan', 'kg', true),
('MINYAK_GOR', 'Minyak Goreng Curah', 'Bahan Makanan', 'liter', false),
('DAGING_SPI', 'Daging Sapi Murni', 'Bahan Makanan', 'kg', false),
('TELUR_AYAM', 'Telur Ayam Ras', 'Bahan Makanan', 'kg', true),
('GULA_PASIR', 'Gula Pasir Lokal', 'Bahan Makanan', 'kg', false),
('TEPUNG_TRG', 'Tepung Terigu', 'Bahan Makanan', 'kg', false),
('KEDELAI', 'Kedelai Impor', 'Bahan Makanan', 'kg', false),
('BBM_PERTAL', 'BBM Pertalite', 'Energi', 'liter', false),
('LPG_3KG', 'LPG 3 Kg', 'Energi', 'tabung', false)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    is_volatile = EXCLUDED.is_volatile;

-- ─── Master: Markets ────────────────────────────────────────────
INSERT INTO markets (name, region_id, source, is_active)
SELECT v.name, r.id, v.source, true
FROM (VALUES
    ('Pasar Inpres Manonda', '7271', 'PIHPS'),
    ('Pasar Masomba', '7271', 'PIHPS'),
    ('Pasar Induk Lere', '7271', 'PIHPS'),
    ('Pasar Poso', '7204', 'PIHPS'),
    ('Pasar Pagindar Donggala', '7205', 'PIHPS')
) AS v(name, region_code, source)
JOIN regions r ON r.code = v.region_code
WHERE NOT EXISTS (
    SELECT 1 FROM markets m WHERE m.name = v.name AND m.region_id = r.id
);

-- ─── Auth Users ─────────────────────────────────────────────────
-- Demo password for every seeded account is "tomoe123" (PBKDF2-SHA256, 100k
-- iters). Change these before any real deployment.
INSERT INTO users (email, name, role, region_id, password_hash, is_active) VALUES
('admin@bi.go.id', 'Admin BI Sulteng', 'admin', (SELECT id FROM regions WHERE code='7200'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc=', true),
('analyst@bi.go.id', 'Analis TPID Sulteng', 'analyst', (SELECT id FROM regions WHERE code='7271'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc=', true),
('tpid@sulteng.go.id', 'Koordinator TPID', 'tpid', (SELECT id FROM regions WHERE code='7200'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc=', true),
('viewer@opd.go.id', 'Staf OPD', 'viewer', (SELECT id FROM regions WHERE code='7271'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc=', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    region_id = EXCLUDED.region_id,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active;

-- ─── Inflation Index: 24 months x 4 components ─────────────────
DO $$
DECLARE
    region_id_sulteng INTEGER := (SELECT id FROM regions WHERE code='7200');
    i INTEGER;
    base_date TIMESTAMPTZ;
    ihk_base NUMERIC;
BEGIN
    FOR i IN 0..23 LOOP
        base_date := date_trunc('month', DATE '2026-05-01' - INTERVAL '23 months') + (i || ' months')::INTERVAL;
        ihk_base := 108.20 + i * 0.36;

        INSERT INTO inflation_index (time, region_id, component, ihk, mtm, yoy, ytd)
        VALUES
            (base_date, region_id_sulteng, 'umum',
                ROUND(ihk_base, 4),
                ROUND((0.22 + 0.10 * SIN(i * 0.70))::numeric, 4),
                ROUND((2.35 + i * 0.035 + 0.35 * SIN(i * 0.45))::numeric, 4),
                ROUND((0.70 + i * 0.035)::numeric, 4)),
            (base_date, region_id_sulteng, 'volatile',
                ROUND((ihk_base - 1.85 + 0.25 * SIN(i * 0.80))::numeric, 4),
                ROUND((0.34 + 0.24 * COS(i * 0.65))::numeric, 4),
                ROUND((3.10 + 0.75 * COS(i * 0.38))::numeric, 4),
                ROUND((0.95 + i * 0.045)::numeric, 4)),
            (base_date, region_id_sulteng, 'core',
                ROUND((ihk_base + 1.60)::numeric, 4),
                ROUND((0.15 + 0.04 * SIN(i * 0.50))::numeric, 4),
                ROUND((1.85 + i * 0.020)::numeric, 4),
                ROUND((0.52 + i * 0.020)::numeric, 4)),
            (base_date, region_id_sulteng, 'administered',
                ROUND((ihk_base + 0.60)::numeric, 4),
                ROUND((0.18 + 0.08 * COS(i * 0.42))::numeric, 4),
                ROUND((2.10 + 0.22 * SIN(i * 0.33))::numeric, 4),
                ROUND((0.60 + i * 0.025)::numeric, 4))
        ON CONFLICT (time, region_id, component) DO UPDATE SET
            ihk = EXCLUDED.ihk,
            mtm = EXCLUDED.mtm,
            yoy = EXCLUDED.yoy,
            ytd = EXCLUDED.ytd;
    END LOOP;
END $$;

-- ─── Inflation by Group: 12 months x 6 groups ──────────────────
DO $$
DECLARE
    region_id_sulteng INTEGER := (SELECT id FROM regions WHERE code='7200');
    i INTEGER;
    g RECORD;
    base_date TIMESTAMPTZ;
BEGIN
    FOR i IN 0..11 LOOP
        base_date := date_trunc('month', DATE '2026-05-01' - INTERVAL '11 months') + (i || ' months')::INTERVAL;
        FOR g IN
            SELECT * FROM (VALUES
                ('Makanan, Minuman, dan Tembakau', 113.0, 0.42, 4.10, 0.14),
                ('Transportasi', 109.0, 0.18, 2.30, 0.04),
                ('Perumahan, Air, Listrik, dan BBM', 108.5, 0.12, 1.90, 0.03),
                ('Penyediaan Makanan dan Minuman', 111.5, 0.24, 3.20, 0.06),
                ('Kesehatan', 106.8, 0.10, 1.75, 0.02),
                ('Pendidikan', 105.2, 0.08, 1.45, 0.01)
            ) AS x(group_name, ihk_base, mtm_base, yoy_base, andil_base)
        LOOP
            INSERT INTO inflation_by_group (time, region_id, group_name, ihk, mtm, yoy, andil_mtm)
            VALUES (
                base_date,
                region_id_sulteng,
                g.group_name,
                ROUND((g.ihk_base + i * 0.28 + 0.20 * SIN(i * 0.55))::numeric, 4),
                ROUND((g.mtm_base + 0.08 * SIN(i * 0.75))::numeric, 4),
                ROUND((g.yoy_base + 0.25 * COS(i * 0.40))::numeric, 4),
                ROUND((g.andil_base + 0.015 * SIN(i * 0.60))::numeric, 4)
            )
            ON CONFLICT (time, region_id, group_name) DO UPDATE SET
                ihk = EXCLUDED.ihk,
                mtm = EXCLUDED.mtm,
                yoy = EXCLUDED.yoy,
                andil_mtm = EXCLUDED.andil_mtm;
        END LOOP;
    END LOOP;
END $$;

-- ─── Commodity Prices: 90 days x 11 commodities x 5 markets ─────
DO $$
DECLARE
    c RECORD;
    m RECORD;
    d INTEGER;
    base_date TIMESTAMPTZ;
    price_val NUMERIC;
    prev_price NUMERIC;
    market_factor NUMERIC;
BEGIN
    FOR c IN
        SELECT id, code,
            CASE code
                WHEN 'BERAS_PREM' THEN 14800
                WHEN 'CABAI_MERAH' THEN 55000
                WHEN 'BAWANG_MRH' THEN 38000
                WHEN 'MINYAK_GOR' THEN 18500
                WHEN 'DAGING_SPI' THEN 145000
                WHEN 'TELUR_AYAM' THEN 29000
                WHEN 'GULA_PASIR' THEN 16500
                WHEN 'TEPUNG_TRG' THEN 13000
                WHEN 'KEDELAI' THEN 12500
                WHEN 'BBM_PERTAL' THEN 10000
                WHEN 'LPG_3KG' THEN 21000
                ELSE 20000
            END::NUMERIC AS base_price,
            CASE WHEN is_volatile THEN 0.060 ELSE 0.020 END::NUMERIC AS amplitude
        FROM commodities
        ORDER BY id
    LOOP
        FOR m IN SELECT id, name FROM markets WHERE is_active = true ORDER BY id LOOP
            market_factor := CASE
                WHEN m.name ILIKE '%Masomba%' THEN 1.012
                WHEN m.name ILIKE '%Lere%' THEN 0.996
                WHEN m.name ILIKE '%Poso%' THEN 1.025
                WHEN m.name ILIKE '%Donggala%' THEN 1.018
                ELSE 1.000
            END;
            prev_price := NULL;

            FOR d IN 0..89 LOOP
                base_date := (DATE '2026-06-01' - ((89 - d) || ' days')::INTERVAL)::TIMESTAMPTZ;
                price_val := c.base_price
                    * market_factor
                    * (1 + c.amplitude * SIN(d * 0.18))
                    * (1 + 0.003 * d / 7);

                -- Give cabai a visible late-period pressure for EWS/forecast demo.
                IF c.code = 'CABAI_MERAH' AND d >= 78 THEN
                    price_val := price_val * (1 + (d - 77) * 0.012);
                END IF;

                -- Mild late pressure for bawang and telur.
                IF c.code IN ('BAWANG_MRH', 'TELUR_AYAM') AND d >= 82 THEN
                    price_val := price_val * (1 + (d - 81) * 0.006);
                END IF;

                INSERT INTO commodity_prices (time, commodity_id, market_id, price, price_change, source)
                VALUES (
                    base_date,
                    c.id,
                    m.id,
                    ROUND(price_val, 0),
                    CASE WHEN prev_price IS NULL THEN 0 ELSE ROUND(price_val - prev_price, 0) END,
                    'DEMO_SEED'
                )
                ON CONFLICT (time, commodity_id, market_id) DO UPDATE SET
                    price = EXCLUDED.price,
                    price_change = EXCLUDED.price_change,
                    source = EXCLUDED.source;

                prev_price := price_val;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ─── Refresh seed-owned ML/event outputs ────────────────────────
DELETE FROM ews_alerts
WHERE metadata ->> 'seed' = 'demo'
   OR message IN (
        'Harga cabai merah melampaui ambang 2-sigma. Tekanan inflasi volatile food tinggi.',
        'Harga beras melebihi batas atas forecast. Potensi kenaikan IHK kelompok bahan makanan.',
        'Lonjakan sentimen negatif bawang merah di media sosial. Pantau persediaan pasar.',
        'Harga minyak goreng melebihi threshold normal.'
   );
DELETE FROM sentiment_scores
WHERE source_url LIKE 'seed://tomoe/%'
   OR text_snippet IN (
        'Harga beras premium naik signifikan di Pasar Inpres akibat musim kemarau...',
        'Cabai merah tembus 80ribu/kg, dapur makin berat nih warga Sulteng...',
        'Harga telur ayam stabil, peternak lokal tingkatkan produksi...'
   );
DELETE FROM topics WHERE period = CURRENT_DATE AND label IN (
    'kenaikan_harga',
    'kelangkaan',
    'kelangkaan_pasokan',
    'intervensi_pasar',
    'volatile_food',
    'stabilitas_harga'
);
DELETE FROM forecasts
WHERE params ->> 'seed' = 'demo'
   OR (
        params IS NULL
        AND commodity_id IS NULL
        AND component IN ('umum', 'volatile')
        AND model IN ('SARIMA', 'LSTM', 'Ensemble')
        AND mape IN (3.5, 3.8, 4.2, 6.1)
   );

-- ─── Forecast Results: 7/14/30-day horizons ─────────────────────
WITH targets AS (
    SELECT r.id AS region_id, c.id AS commodity_id, c.code, c.name
    FROM regions r
    CROSS JOIN commodities c
    WHERE r.code = '7271'
      AND c.code IN ('CABAI_MERAH', 'BERAS_PREM', 'BAWANG_MRH', 'TELUR_AYAM')
),
horizons AS (
    SELECT * FROM (VALUES
        (7, 1.018, 0.055, 7.8),
        (14, 1.036, 0.075, 8.4),
        (30, 1.060, 0.105, 9.2)
    ) AS h(days, lift, band, mape)
),
latest AS (
    SELECT DISTINCT ON (cp.commodity_id)
        cp.commodity_id,
        cp.price::NUMERIC AS price
    FROM commodity_prices cp
    JOIN markets m ON m.id = cp.market_id
    WHERE m.name = 'Pasar Inpres Manonda'
    ORDER BY cp.commodity_id, cp.time DESC
)
INSERT INTO forecasts (region_id, commodity_id, component, model, forecast_date, predicted, lower_bound, upper_bound, mape, params)
SELECT
    t.region_id,
    t.commodity_id,
    NULL,
    'Ensemble',
    DATE '2026-06-01' + (h.days || ' days')::INTERVAL,
    ROUND((l.price * h.lift)::numeric, 4),
    ROUND((l.price * h.lift * (1 - h.band))::numeric, 4),
    ROUND((l.price * h.lift * (1 + h.band))::numeric, 4),
    h.mape,
    jsonb_build_object('seed', 'demo', 'horizon_days', h.days, 'seasonal_periods', 7, 'level', 'commodity')
FROM targets t
JOIN latest l ON l.commodity_id = t.commodity_id
CROSS JOIN horizons h;

INSERT INTO forecasts (region_id, commodity_id, component, model, forecast_date, predicted, lower_bound, upper_bound, mape, params)
VALUES
((SELECT id FROM regions WHERE code='7200'), NULL, 'umum', 'SARIMA', DATE '2026-06-30', 3.28, 2.95, 3.61, 4.2, '{"seed":"demo","level":"inflation","horizon_days":30}'::jsonb),
((SELECT id FROM regions WHERE code='7200'), NULL, 'umum', 'LSTM', DATE '2026-06-30', 3.35, 3.00, 3.70, 3.8, '{"seed":"demo","level":"inflation","horizon_days":30}'::jsonb),
((SELECT id FROM regions WHERE code='7200'), NULL, 'umum', 'Ensemble', DATE '2026-06-30', 3.31, 2.97, 3.65, 3.5, '{"seed":"demo","level":"inflation","horizon_days":30}'::jsonb),
((SELECT id FROM regions WHERE code='7200'), NULL, 'volatile', 'Ensemble', DATE '2026-06-30', 5.12, 4.20, 6.04, 6.1, '{"seed":"demo","level":"inflation","horizon_days":30}'::jsonb);

-- ─── Sentiment Topics ───────────────────────────────────────────
INSERT INTO topics (label, keywords, doc_count, period) VALUES
('kenaikan_harga', ARRAY['naik', 'harga', 'mahal', 'lonjakan', 'melejit'], 18, CURRENT_DATE),
('kelangkaan_pasokan', ARRAY['langka', 'kosong', 'sulit', 'pasokan', 'habis'], 12, CURRENT_DATE),
('intervensi_pasar', ARRAY['operasi pasar', 'stabilisasi', 'pemerintah', 'TPID', 'subsidi'], 10, CURRENT_DATE),
('volatile_food', ARRAY['cabai', 'bawang', 'telur', 'tomat', 'bumbu'], 14, CURRENT_DATE),
('stabilitas_harga', ARRAY['stabil', 'turun', 'normal', 'terjangkau', 'aman'], 6, CURRENT_DATE);

-- ─── Sentiment Scores: 60 deterministic demo documents ─────────
DO $$
DECLARE
    i INTEGER;
    topic_id INTEGER;
    commodity_code TEXT;
    sentiment_label TEXT;
    score_val NUMERIC;
    confidence_val NUMERIC;
    source_type_val TEXT;
    snippet TEXT;
BEGIN
    FOR i IN 0..59 LOOP
        commodity_code := CASE i % 5
            WHEN 0 THEN 'CABAI_MERAH'
            WHEN 1 THEN 'BERAS_PREM'
            WHEN 2 THEN 'BAWANG_MRH'
            WHEN 3 THEN 'TELUR_AYAM'
            ELSE 'MINYAK_GOR'
        END;
        source_type_val := CASE i % 4
            WHEN 0 THEN 'news'
            WHEN 1 THEN 'twitter'
            WHEN 2 THEN 'instagram'
            ELSE 'news'
        END;
        sentiment_label := CASE
            WHEN i % 10 IN (0, 1, 2, 3, 4, 5) THEN 'negatif'
            WHEN i % 10 IN (6, 7) THEN 'netral'
            ELSE 'positif'
        END;
        score_val := CASE sentiment_label
            WHEN 'negatif' THEN -0.62 - ((i % 6) * 0.045)
            WHEN 'netral' THEN -0.05 + ((i % 3) * 0.04)
            ELSE 0.46 + ((i % 4) * 0.06)
        END;
        confidence_val := 0.76 + ((i % 5) * 0.04);
        topic_id := CASE
            WHEN sentiment_label = 'positif' THEN (SELECT id FROM topics WHERE label='stabilitas_harga' ORDER BY id DESC LIMIT 1)
            WHEN i % 3 = 0 THEN (SELECT id FROM topics WHERE label='volatile_food' ORDER BY id DESC LIMIT 1)
            WHEN i % 3 = 1 THEN (SELECT id FROM topics WHERE label='kenaikan_harga' ORDER BY id DESC LIMIT 1)
            ELSE (SELECT id FROM topics WHERE label='kelangkaan_pasokan' ORDER BY id DESC LIMIT 1)
        END;
        snippet := CASE sentiment_label
            WHEN 'positif' THEN 'Harga komoditas mulai stabil setelah pasokan pasar membaik di Palu.'
            WHEN 'netral' THEN 'Pedagang memantau stok pangan menjelang akhir pekan di pasar tradisional.'
            ELSE 'Warga mengeluhkan harga komoditas pangan yang naik dan pasokan mulai terbatas.'
        END;

        INSERT INTO sentiment_scores (
            time, source_url, source_type, commodity_id, region_id,
            text_snippet, sentiment, score, confidence, topic_id
        )
        VALUES (
            TIMESTAMPTZ '2026-06-01 08:00:00+08' - (i || ' hours')::INTERVAL,
            'seed://tomoe/sentiment/' || i,
            source_type_val,
            (SELECT id FROM commodities WHERE code = commodity_code),
            (SELECT id FROM regions WHERE code = CASE WHEN i % 4 = 0 THEN '7200' ELSE '7271' END),
            snippet,
            sentiment_label,
            ROUND(score_val, 4),
            ROUND(confidence_val, 4),
            topic_id
        );
    END LOOP;
END $$;

-- ─── EWS Alerts ─────────────────────────────────────────────────
INSERT INTO ews_alerts (
    region_id, commodity_id, alert_type, severity, actual_value, threshold,
    message, status, triggered_at, metadata
)
VALUES
(
    (SELECT id FROM regions WHERE code='7271'),
    (SELECT id FROM commodities WHERE code='CABAI_MERAH'),
    '2sigma', 'high', 80000, 65000,
    'Harga cabai merah melampaui ambang 2-sigma. Tekanan inflasi volatile food tinggi.',
    'open', TIMESTAMPTZ '2026-06-01 07:30:00+08',
    '{"seed":"demo","detector":"robust_mad","lead_time_days":5}'::jsonb
),
(
    (SELECT id FROM regions WHERE code='7271'),
    (SELECT id FROM commodities WHERE code='BERAS_PREM'),
    'forecast_breach', 'high', 15200, 14800,
    'Harga beras melebihi batas atas forecast. Potensi kenaikan IHK kelompok bahan makanan.',
    'open', TIMESTAMPTZ '2026-06-01 06:45:00+08',
    '{"seed":"demo","horizon_days":7}'::jsonb
),
(
    (SELECT id FROM regions WHERE code='7200'),
    (SELECT id FROM commodities WHERE code='BAWANG_MRH'),
    'sentiment_spike', 'medium', -0.85, -0.70,
    'Lonjakan sentimen negatif bawang merah di media sosial. Pantau persediaan pasar.',
    'acknowledged', TIMESTAMPTZ '2026-06-01 05:30:00+08',
    '{"seed":"demo","negative_share":0.68}'::jsonb
),
(
    (SELECT id FROM regions WHERE code='7205'),
    (SELECT id FROM commodities WHERE code='MINYAK_GOR'),
    '2sigma', 'medium', 20000, 18800,
    'Harga minyak goreng melebihi threshold normal di Donggala.',
    'resolved', TIMESTAMPTZ '2026-05-31 09:00:00+08',
    '{"seed":"demo","detector":"zscore"}'::jsonb
),
(
    (SELECT id FROM regions WHERE code='7204'),
    (SELECT id FROM commodities WHERE code='TELUR_AYAM'),
    'forecast_breach', 'low', 28200, 28500,
    'Harga telur ayam berada di bawah interval forecast; risiko tekanan harga mereda.',
    'open', TIMESTAMPTZ '2026-05-31 08:00:00+08',
    '{"seed":"demo","direction":"below"}'::jsonb
);

COMMIT;
