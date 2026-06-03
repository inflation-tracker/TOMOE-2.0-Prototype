-- ═══════════════════════════════════════════════════════════════
-- TOMOE 2.0 — Seed Data (Mock)
-- ═══════════════════════════════════════════════════════════════

-- ─── Regions ────────────────────────────────────────────────────
INSERT INTO regions (code, name, type, latitude, longitude) VALUES
('7200', 'Sulawesi Tengah', 'provinsi', -1.4300, 121.4456),
('7271', 'Kota Palu', 'kota', -0.9003, 119.8779),
('7201', 'Banggai', 'kabupaten', -1.6000, 123.0000),
('7202', 'Banggai Kepulauan', 'kabupaten', -1.6536, 123.3333),
('7203', 'Morowali', 'kabupaten', -2.9000, 122.0000),
('7204', 'Poso', 'kabupaten', -1.3958, 120.7551),
('7205', 'Donggala', 'kabupaten', -0.7956, 119.7368),
('7206', 'Toli-Toli', 'kabupaten', 1.0556, 120.8148),
('7207', 'Buol', 'kabupaten', 0.9783, 121.4278),
('7208', 'Parigi Moutong', 'kabupaten', -0.6280, 120.1887),
('7209', 'Tojo Una-Una', 'kabupaten', -1.5820, 121.6250),
('7210', 'Sigi', 'kabupaten', -1.3100, 120.0000),
('7211', 'Banggai Laut', 'kabupaten', -1.7900, 123.4900),
('7212', 'Morowali Utara', 'kabupaten', -2.2000, 121.6000)
ON CONFLICT (code) DO NOTHING;

-- ─── Commodities ────────────────────────────────────────────────
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
ON CONFLICT (code) DO NOTHING;

-- ─── Markets ────────────────────────────────────────────────────
INSERT INTO markets (name, region_id, source) VALUES
('Pasar Inpres Manonda', (SELECT id FROM regions WHERE code='7271'), 'PIHPS'),
('Pasar Masomba', (SELECT id FROM regions WHERE code='7271'), 'PIHPS'),
('Pasar Induk Lere', (SELECT id FROM regions WHERE code='7271'), 'PIHPS'),
('Pasar Poso', (SELECT id FROM regions WHERE code='7204'), 'PIHPS'),
('Pasar Pagindar Donggala', (SELECT id FROM regions WHERE code='7205'), 'PIHPS');

-- ─── Users ──────────────────────────────────────────────────────
-- Demo password for every seeded account is "tomoe123" (PBKDF2-SHA256, 100k
-- iters). CHANGE THIS before any real deployment.
INSERT INTO users (email, name, role, region_id, password_hash) VALUES
('admin@bi.go.id', 'Admin BI Sulteng', 'admin', (SELECT id FROM regions WHERE code='7200'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc='),
('analyst@bi.go.id', 'Analis TPID Sulteng', 'analyst', (SELECT id FROM regions WHERE code='7271'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc='),
('tpid@sulteng.go.id', 'Koordinator TPID', 'tpid', (SELECT id FROM regions WHERE code='7200'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc='),
('viewer@opd.go.id', 'Staf OPD', 'viewer', (SELECT id FROM regions WHERE code='7271'), 'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc=')
ON CONFLICT (email) DO NOTHING;

-- ─── Inflation Index (24 months of mock data) ───────────────────
DO $$
DECLARE
    region_id_sulteng INTEGER := (SELECT id FROM regions WHERE code='7200');
    i INTEGER;
    base_date TIMESTAMPTZ;
    yoy_umum DECIMAL;
    yoy_volatile DECIMAL;
    yoy_core DECIMAL;
    ihk_val DECIMAL := 108.0;
BEGIN
    FOR i IN 0..23 LOOP
        base_date := date_trunc('month', NOW() - INTERVAL '23 months') + (i || ' months')::INTERVAL;
        yoy_umum := 2.5 + 0.4 * SIN(i * 0.5) + i * 0.025 + RANDOM() * 0.2;
        yoy_volatile := 3.2 + 1.0 * COS(i * 0.4) + RANDOM() * 0.5;
        yoy_core := 1.8 + i * 0.02 + RANDOM() * 0.1;
        ihk_val := ihk_val + 0.3 + RANDOM() * 0.2;

        INSERT INTO inflation_index (time, region_id, component, ihk, mtm, yoy, ytd)
        VALUES
            (base_date, region_id_sulteng, 'umum', ihk_val, 0.25 + RANDOM() * 0.2, ROUND(yoy_umum::numeric, 2), ROUND((yoy_umum * 0.3)::numeric, 2)),
            (base_date, region_id_sulteng, 'volatile', ihk_val - 2, 0.45 + RANDOM() * 0.4, ROUND(yoy_volatile::numeric, 2), ROUND((yoy_volatile * 0.3)::numeric, 2)),
            (base_date, region_id_sulteng, 'core', ihk_val + 2, 0.15 + RANDOM() * 0.1, ROUND(yoy_core::numeric, 2), ROUND((yoy_core * 0.3)::numeric, 2))
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ─── Commodity Prices (30 days of daily mock data) ──────────────
DO $$
DECLARE
    c RECORD;
    m RECORD;
    i INTEGER;
    price_val DECIMAL;
    prev_price DECIMAL;
    base_prices DECIMAL[] := ARRAY[14800, 55000, 38000, 18500, 145000, 29000, 16500, 13000, 12500, 10000, 21000];
    idx INTEGER := 1;
BEGIN
    FOR c IN SELECT id FROM commodities ORDER BY id LOOP
        FOR m IN SELECT id FROM markets WHERE id = 1 LOOP
            price_val := base_prices[idx];
            prev_price := price_val;
            FOR i IN 0..29 LOOP
                price_val := price_val * (1 + (RANDOM() - 0.48) * 0.02);
                INSERT INTO commodity_prices (time, commodity_id, market_id, price, price_change, source)
                VALUES (
                    NOW() - ((29 - i) || ' days')::INTERVAL,
                    c.id, m.id,
                    ROUND(price_val::numeric, 0),
                    ROUND((price_val - prev_price)::numeric, 0),
                    'PIHPS_MOCK'
                ) ON CONFLICT DO NOTHING;
                prev_price := price_val;
            END LOOP;
        END LOOP;
        idx := LEAST(idx + 1, 11);
    END LOOP;
END $$;

-- ─── EWS Alerts (mock recent alerts) ────────────────────────────
INSERT INTO ews_alerts (region_id, commodity_id, alert_type, severity, actual_value, threshold, message, status, triggered_at)
VALUES
(
    (SELECT id FROM regions WHERE code='7271'),
    (SELECT id FROM commodities WHERE code='CABAI_MERAH'),
    '2sigma', 'high', 80000, 65000,
    'Harga cabai merah melampaui ambang 2-sigma. Tekanan inflasi volatile food tinggi.',
    'open', NOW()
),
(
    (SELECT id FROM regions WHERE code='7204'),
    (SELECT id FROM commodities WHERE code='BERAS_PREM'),
    'forecast_breach', 'high', 15200, 14800,
    'Harga beras melebihi batas atas forecast. Potensi kenaikan IHK kelompok bahan makanan.',
    'open', NOW() - INTERVAL '1 hour'
),
(
    (SELECT id FROM regions WHERE code='7200'),
    (SELECT id FROM commodities WHERE code='BAWANG_MRH'),
    'sentiment_spike', 'medium', -0.85, -0.70,
    'Lonjakan sentimen negatif bawang merah di media sosial. Pantau persediaan pasar.',
    'acknowledged', NOW() - INTERVAL '2 hours'
),
(
    (SELECT id FROM regions WHERE code='7205'),
    (SELECT id FROM commodities WHERE code='MINYAK_GOR'),
    '2sigma', 'medium', 20000, 18800,
    'Harga minyak goreng melebihi threshold normal.',
    'resolved', NOW() - INTERVAL '1 day'
);

-- ─── Forecast Results ────────────────────────────────────────────
INSERT INTO forecasts (region_id, component, model, forecast_date, predicted, lower_bound, upper_bound, mape)
VALUES
((SELECT id FROM regions WHERE code='7200'), 'umum', 'SARIMA', NOW() + INTERVAL '30 days', 3.28, 2.95, 3.61, 4.2),
((SELECT id FROM regions WHERE code='7200'), 'umum', 'LSTM', NOW() + INTERVAL '30 days', 3.35, 3.00, 3.70, 3.8),
((SELECT id FROM regions WHERE code='7200'), 'umum', 'Ensemble', NOW() + INTERVAL '30 days', 3.31, 2.97, 3.65, 3.5),
((SELECT id FROM regions WHERE code='7200'), 'volatile', 'Ensemble', NOW() + INTERVAL '30 days', 5.12, 4.20, 6.04, 6.1);

-- ─── Sentiment Topics ────────────────────────────────────────────
INSERT INTO topics (label, keywords, doc_count, period) VALUES
('kenaikan_harga', ARRAY['naik', 'harga', 'mahal', 'lonjakan', 'melejit'], 450, CURRENT_DATE),
('kelangkaan', ARRAY['langka', 'kosong', 'sulit', 'tidak ada', 'habis'], 230, CURRENT_DATE),
('intervensi_pasar', ARRAY['operasi pasar', 'stabilisasi', 'pemerintah', 'TPID', 'subsidi'], 180, CURRENT_DATE),
('volatile_food', ARRAY['cabai', 'bawang', 'tomat', 'sayur', 'bumbu'], 380, CURRENT_DATE),
('stabilitas_harga', ARRAY['stabil', 'turun', 'normal', 'terjangkau', 'aman'], 120, CURRENT_DATE);

-- ─── Sentiment Scores (sample) ───────────────────────────────────
INSERT INTO sentiment_scores (time, source_type, commodity_id, region_id, text_snippet, sentiment, score, confidence, topic_id)
VALUES
(NOW(), 'news',
    (SELECT id FROM commodities WHERE code='BERAS_PREM'),
    (SELECT id FROM regions WHERE code='7271'),
    'Harga beras premium naik signifikan di Pasar Inpres akibat musim kemarau...',
    'negatif', -0.82, 0.91,
    (SELECT id FROM topics WHERE label='kenaikan_harga')),
(NOW(), 'twitter',
    (SELECT id FROM commodities WHERE code='CABAI_MERAH'),
    (SELECT id FROM regions WHERE code='7271'),
    'Cabai merah tembus 80ribu/kg, dapur makin berat nih warga Sulteng...',
    'negatif', -0.91, 0.95,
    (SELECT id FROM topics WHERE label='volatile_food')),
(NOW(), 'news',
    (SELECT id FROM commodities WHERE code='TELUR_AYAM'),
    (SELECT id FROM regions WHERE code='7271'),
    'Harga telur ayam stabil, peternak lokal tingkatkan produksi...',
    'positif', 0.65, 0.78,
    (SELECT id FROM topics WHERE label='stabilitas_harga'));

COMMIT;
