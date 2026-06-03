# Jawaban Submission Tahap 2 — Digdaya x Hackathon 2026

> Sumber jawaban: Proposal Tahap 1 (`Proposal_Digdaya_x_Hackaton_EWS_Inflation`) **+ kondisi kode/web terkini** yang sudah dibangun di repository ini (frontend Next.js, ML service FastAPI, pipeline ingestion, skema database).
> Diperbarui: 3 Juni 2026.
>
> ⚠️ **Perlu dikonfirmasi sebelum submit:** `ID Tim` (format P00xx) dan `Proposal Title` final. Field lain sudah terisi.

---

## 1. ID Tim *
`[ISI SESUAI DATA PENDAFTARAN — contoh: P0041]`

## 2. Nama Tim *
Inflation Tracker (IT)

## 3. Proposal Title *
TOMOE 2.0 — Sistem Peringatan Dini Inflasi Berbasis AI (Forecasting + Opinion Intelligence)

## 4. Team Composition *
- **Rohis Rachman** — Ketua Tim / Project Manager & Business Analyst (Bank Indonesia Provinsi Sulawesi Tengah). Mengoordinasikan proyek, merumuskan *use case*, dan memastikan solusi relevan bagi pengambilan keputusan kebijakan.
- **Yayang Matira** — AI Engineer. Mengembangkan model *forecasting* (Prophet/SARIMA, LSTM, ensemble) dan modul NLP (IndoBERT, BERTopic) untuk analisis sentimen dan topik.
- **Moh. Batara** — Full Stack Developer. Membangun arsitektur sistem, backend/API (Python FastAPI), dan dashboard aplikasi web.
- **Wawan Saputra** — Data Analyst. Bertanggung jawab pada pipeline ingestion, pembersihan, integrasi, dan analisis data inflasi.

## 5. Executive Summary *
TOMOE 2.0 adalah platform berbasis AI untuk **deteksi dini lonjakan harga sebelum tercermin dalam data resmi**. Masalah utama: sistem pemantauan inflasi masih reaktif — data IHK BPS hanya bulanan dengan *lag* 2–4 minggu, data harga harian/proyeksi/sentimen publik masih terpisah lintas lembaga, sehingga intervensi (operasi pasar, distribusi, subsidi) baru terjadi setelah harga naik. Pendekatan kami menyatukan tiga sinyal — **harga aktual, proyeksi (forecast), dan sentimen publik** — dalam satu dashboard terpadu dengan *early warning* berbasis ambang. Dampak utama yang ditargetkan: pengambil kebijakan (BI, TPID, Kemendag) dapat beralih dari reaktif ke **antisipatif**, mendeteksi tekanan harga 2–3 minggu lebih awal, terutama pada momentum musiman (Ramadan/Lebaran).

## 6. Problem Statement *
Peningkatan Produktivitas, Ketahanan Pangan, dan Penciptaan Lapangan Kerja.

## 7. Primary Sub-Problem Statement *
Digitalisasi Ketahanan Pangan — secara spesifik: belum adanya sistem peringatan dini inflasi pangan yang mengintegrasikan data harga harian, proyeksi, dan sentimen publik secara *real-time* untuk mendukung pengendalian inflasi yang antisipatif.

## 8. Problem Validation *
Sistem pemantauan inflasi Indonesia menghadapi tiga *gap* yang saling memperburuk:
1. **Time-lag data** — data inflasi BPS hanya tersedia bulanan dengan *lag* 2–4 minggu, sehingga sinyal kenaikan harga terlambat diterima pengambil kebijakan.
2. **Fragmentasi data** — belum ada platform terintegrasi yang menggabungkan data harga harian, proyeksi ke depan, dan sentimen publik; ketiganya masih terpisah lintas lembaga.
3. **Sinyal ekspektasi tak termonitor** — arus informasi dari media berita dan media sosial yang membentuk ekspektasi publik belum terpantau optimal, padahal penting dalam strategi 4K pengendalian inflasi.

Akar masalah: intervensi cenderung **reaktif setelah harga naik, bukan preventif**. Bukti nyata: pada Februari 2026 inflasi melonjak hingga **4,76% (YoY)**, melampaui target nasional 2,5 ± 1%, dipicu *low base effect* tarif listrik serta tekanan HBKN yang datang lebih awal dan lebih panjang, ditambah gangguan pasokan cabai/daging akibat cuaca ekstrem dan kebutuhan program MBG.

## 9. Problem–Solution Mapping *
| Problem | Mekanisme Solusi | Outcome |
|---|---|---|
| Data inflasi resmi terlambat (lag bulanan) | *Forecasting Engine* (SARIMA/LSTM/ensemble) memproyeksikan harga 7/14/30 hari + ingestion harga harian PIHPS | Sinyal tekanan harga tersedia **harian**, bukan menunggu rilis bulanan |
| Data tersebar lintas sumber | Pipeline ingestion → staging/cleaning → Data Warehouse (PostgreSQL + TimescaleDB) → satu dashboard | Referensi data tunggal yang dipakai bersama lintas lembaga |
| Ekspektasi publik tak termonitor | *Opinion Intelligence Engine* (IndoBERT + BERTopic) memantau sentimen & topik berita/sosmed | Lonjakan sentimen negatif jadi *leading indicator* inflasi |
| Intervensi terlambat | *Early Warning* otomatis saat proyeksi keluar dari target 2,5±1% atau ambang 2-sigma/sentimen terlampaui | Notifikasi dini → intervensi preventif sebelum lonjakan menyebar |

## 10. Ecosystem Alignment *
Solusi dirancang selaras dengan **strategi 4K pengendalian inflasi** dan kerangka kerja TPIP/TPID. Stakeholder utama: **Bank Indonesia** (analis & komunikasi kebijakan), **TPID** (koordinasi daerah), **Kemendag/Kementan** (operasi pasar & distribusi). TOMOE 2.0 berperan sebagai *decision-support* — menyediakan sinyal dan referensi data bersama, **bukan** pengganti kewenangan kebijakan. Data primer bersumber dari kanal publik resmi (Panel Harga Pangan Kementan, PIHPS, API BPS), sehingga tidak ada hambatan regulasi akses. Output dirancang untuk mempercepat sinkronisasi analisis antarlembaga tanpa pertukaran laporan manual.

## 11. Solution Approach & Mechanism *
Alur kerja end-to-end (tercermin pada arsitektur kode terkini):
- **Input:** harga komoditas harian (Panel Harga Pangan & PIHPS), IHK resmi BPS (baseline kalibrasi), berita daring via RSS, dan media sosial (X/Twitter) ter-filter lokasi & Bahasa Indonesia.
- **Proses:** data masuk *pipeline ingestion* (scraper PIHPS & BPS) → *quality check* (deduplikasi, validasi format, *noise filtering*) → Data Warehouse (PostgreSQL + TimescaleDB). Lapisan analitik (ML service FastAPI) berjalan paralel:
  - `/forecast/run` — SARIMA / LSTM / ensemble (proyeksi 7/14/30 hari + *confidence interval*).
  - `/sentiment/analyze` & `/sentiment/batch` — IndoBERT (positif/netral/negatif).
  - `/topics/fit` — BERTopic (klaster topik diskusi harga).
  - `/ews/detect` — deteksi anomali 2-sigma **dan** detektor robust (median + MAD) untuk seri harga yang *skewed*.
- **Output (dashboard web interaktif):** grafik harga *real-time* per komoditas/wilayah, indikator inflasi harian (filter per wilayah), grafik proyeksi 7/14/30 hari dengan CI, *heatmap* tekanan harga per wilayah, *feed* topik & skor sentimen publik, serta **notifikasi early warning otomatis** saat ambang terlampaui.

## 12. Impact Scale & Targets *
Skala dampak: **270 juta penduduk Indonesia**, terutama kelompok berpendapatan rendah yang mengalokasikan **>60% pengeluaran untuk pangan** — kelompok paling rentan terhadap lonjakan harga tak terduga. Target awal (v1) berfokus pada **Provinsi Sulawesi Tengah** sebagai pilot, dengan arsitektur yang dapat direplikasi per provinsi. Pada momentum kritis (Ramadan/Lebaran), lonjakan harga dapat dideteksi dan dimitigasi sebelum memukul daya beli masyarakat.

## 13. Impact Measurement *
Keberhasilan diukur secara kuantitatif (mengacu metrik PRD):
| Kategori | Metrik | Target v1 |
|---|---|---|
| Deteksi | Lead time alert sebelum lonjakan terkonfirmasi | ≥ 3–7 hari |
| Deteksi | False positive rate alert | < 30% |
| Akurasi ML | MAPE forecast harga komoditas volatile | ≤ 10% |
| Akurasi ML | Akurasi klasifikasi sentimen (IndoBERT) | ≥ 80% |
| Performa | Load dashboard utama (p95) | < 2 detik |
| Operasional | Uptime ingestion harian | ≥ 95% job sukses |
| Data | Freshness data harga | ≤ 1 hari |
| Adopsi | Alert yang di-*acknowledge* oleh TPID | ≥ 70% |

## 14. System & Public Value Proposition *
Bagi sistem yang lebih luas, TOMOE 2.0 memberikan: (1) **referensi data tunggal** lintas lembaga yang mempercepat koordinasi kebijakan; (2) **public intelligence** — ekspektasi inflasi yang terukur membantu BI menyusun komunikasi kebijakan yang lebih tepat sasaran; (3) **ketepatan subsidi** — data granular per wilayah & komoditas mengurangi risiko salah sasaran program pangan nasional; (4) pergeseran paradigma pengendalian inflasi dari **reaktif ke antisipatif** sebagai *public good*.

## 15. Solution Originality *
Yang benar-benar baru: penggabungan **tiga model machine learning dalam satu sistem terintegrasi** — model prediktif (*time-series*), analisis sentimen, dan pemodelan topik — yang dihubungkan dengan *early warning* berbasis ambang yang dapat dikonfigurasi. Berbeda dari dashboard inflasi yang ada (umumnya hanya historis), TOMOE 2.0 bersifat **prediktif + behavioral + actionable**. Inovasi utama: menjadikan **lonjakan diskusi publik di ruang digital sebagai *leading indicator*** yang memberi sinyal lebih awal dibanding data pasar formal.

| Solusi | Keunggulan / Keterbatasan |
|---|---|
| **TOMOE 2.0** | Harga harian, forecasting, sentimen publik, isu strategis, *early warning* |
| Dashboard Kemendag | Hanya data historis, tanpa forecasting/sentimen |
| SISKAPERBAPO (Jateng) | Cakupan lokal, tanpa komponen AI/ML |
| Bloomberg Terminal | Forecasting ada tapi berbayar mahal, tidak spesifik konteks Indonesia |
| Sistem BI/OJK eksisting | Tanpa opinion intelligence / integrasi data publik digital |

## 16. Technological / Method Innovation *
- **NLP berbahasa Indonesia:** IndoBERT (model pra-latih *state of the art* untuk Bahasa Indonesia) mampu memahami konteks lokal termasuk slang/dialek; BERTopic untuk deteksi klaster topik diskusi harga.
- **Forecasting interpretable:** Prophet/SARIMA menangani pola musiman (Ramadan, panen), *missing data*, dan *holiday effect* secara otomatis — *interpretable* bagi pengambil kebijakan non-teknis; dikombinasikan LSTM dalam mode *ensemble*.
- **Deteksi anomali robust:** EWS tidak hanya 2-sigma standar, tapi juga detektor **median + MAD** yang tahan terhadap distribusi harga *skewed*.
- **Fusi sinyal:** skor sentimen negatif yang melonjak dikombinasikan dengan sinyal *Forecasting Engine* untuk meningkatkan akurasi *early warning*.

## 17. Creativity in Implementation *
- **Distribusi bertahap:** fase awal sebagai *public good* open-source; jangka menengah model B2G (integrasi & dukungan teknis untuk Pemda/TPID).
- **User engagement:** dashboard reaktif dengan notifikasi *early warning* otomatis dan *feed* topik trending — pengguna ditarik oleh sinyal yang *actionable*, bukan sekadar laporan statis.
- **Efisiensi komputasi:** hasil ML dihitung di *background*/cache (lihat *job runtime* dengan kontrol kapasitas & timeout serta *cache* pada ML service); halaman dashboard tinggal membaca dari DB sehingga load <2 detik.
- **Replikasi murah:** penambahan provinsi hanya menambah *pipeline ingestion*, tanpa mengubah arsitektur inti.

## 18. System Architecture *
Arsitektur berlapis (sesuai implementasi terkini di repo):
1. **Frontend — Next.js 14 (App Router) + TypeScript + Tailwind CSS.** 10 halaman dashboard (Dashboard, Analytics, Early Warning, Laporan, Forecasting, Komoditas, Sentimen, Geospatial, Pengaturan, Bantuan). State via React Query + Zustand; visualisasi via Chart.js/Recharts; peta sebaran wilayah. Lapisan *BFF* berupa API routes Next.js (dashboard, inflation, commodities, forecast, sentiment, ews, geospatial, users, auth) dengan *middleware* RBAC dan *audit logging*.
2. **ML Service — Python FastAPI.** Endpoint: `/forecast/run`, `/sentiment/analyze`, `/sentiment/batch`, `/topics/fit`, `/ews/detect`, `/admin/warmup`. Dilengkapi *API-key auth*, *job runtime* (kontrol kapasitas → 503, timeout → 504), dan *caching* untuk request berulang.
3. **Ingestion — Python.** Scraper PIHPS & BPS, modul *quality* (deduplikasi/validasi), *db_writer*, dan *scheduler* (job harian).
4. **Data Warehouse — PostgreSQL + TimescaleDB.** 12 tabel: regions, commodities, markets, commodity_prices, inflation_index, inflation_by_group, forecasts, topics, sentiment_scores, ews_alerts, users, audit_logs.
5. **Deployment — Docker Compose** (berkas compose dev & prod) untuk reproduksibilitas, mudah direplikasi, dan siap deploy ke VPS.

## 19. Data & Feasibility *
- **Panel Harga Pangan Kementan & PIHPS:** harga komoditas harian dari pasar tradisional di seluruh Indonesia — sumber data primer resmi dan andal.
- **API BPS / file CSV:** data IHK bulanan resmi sebagai *baseline* kalibrasi model.
- **RSS feed media nasional & daerah:** berita terkait harga & pangan, dikumpulkan via *web scraping* terstruktur.
- **Twitter/X API:** data media sosial dengan *keyword* nama komoditas, di-filter lokasi & Bahasa Indonesia.

Kualitas dijaga melalui **deduplication, noise filtering, dan validasi format** di tahap staging (modul `quality`) sebelum masuk Data Warehouse. Kelayakan tinggi: seluruh sumber utama bersifat publik dan dapat diakses tanpa hambatan regulasi.

## 20. Security & Compliance *
Keamanan dibangun berlapis (sesuai implementasi):
- **Autentikasi & otorisasi:** sesi login pada frontend (login/me/logout) dengan *middleware* **RBAC** untuk pembatasan akses per peran pengguna.
- **Proteksi antar-layanan:** ML service memvalidasi *shared-secret* `X-API-Key`; **CORS** dibatasi pada origin tepercaya; metode HTTP dibatasi (GET/POST).
- **Validasi input:** *schema validation* di kedua sisi (Pydantic di backend, Zod di frontend) untuk mencegah input cacat/injeksi.
- **Ketahanan layanan:** kontrol kapasitas (503) dan timeout (504) mencegah penyalahgunaan/overload.
- **Audit & integritas data:** seluruh perubahan penting tercatat di tabel `audit_logs`; data hasil scraping diproses di lingkungan *staging* terisolasi sebelum masuk Data Warehouse, meminimalkan risiko data kotor.

## 21. Implementation Readiness (MVP) *
**Scope MVP (fokus Sulawesi Tengah):**
- Dashboard web fungsional (10 halaman) terintegrasi dengan database.
- ML service operasional: forecasting (SARIMA/LSTM/ensemble), sentimen (IndoBERT), topik (BERTopic), dan EWS (2-sigma + robust).
- Pipeline ingestion PIHPS/BPS dengan *quality check* dan *scheduler*.
- Skema database 12 tabel + data *seed*.
- Stack ter-*dockerize* (compose dev & prod), siap dijalankan dan dideploy.
- Hardening keamanan (API-key, RBAC, audit log, validasi input).

**Target pembangunan:** menyelesaikan integrasi data riil Sulteng, kalibrasi ambang alert, dan demo MVP live untuk semifinal (sesuai timeline Fase 4 — Juni 2026).

## 22. Value Proposition *
Nilai utama bagi pengguna:
- **Analis BI/TPID:** satu dashboard untuk memantau harga, proyeksi, dan sentimen — plus *alert* otomatis, mengurangi kerja manual lintas sumber.
- **Pengambil kebijakan:** sinyal tekanan harga **harian** (bukan menunggu rilis bulanan), memungkinkan diskusi & intervensi kebijakan dimulai lebih awal.
- **Lintas lembaga:** referensi data bersama yang mempercepat koordinasi tanpa pertukaran laporan manual.

## 23. Model Revenue / Funding *
- **Fase awal (public good):** dikembangkan sebagai platform open-source; pendanaan dari program/hibah inovasi dan dukungan institusional (BI/Pemda).
- **Jangka menengah (B2G):** layanan premium untuk pemerintah daerah (Pemda/TPID) berupa integrasi data khusus, analisis komoditas tambahan, dan dukungan teknis. Target **10 Pemda dalam 18 bulan pasca-MVP**.

## 24. Cost Structure & Sustainability *
- **Komponen biaya utama:** server/VPS (hosting + inferensi ML), pemeliharaan pipeline data, dan tim pemeliharaan. **Tidak ada biaya lisensi vendor** karena seluruh stack open-source (Prophet, IndoBERT, PostgreSQL, Docker, Next.js, FastAPI).
- **Keberlanjutan:** arsitektur open-source menekan biaya tetap; efisiensi komputasi (caching + komputasi background) menekan biaya inferensi. Pendapatan B2G jangka menengah membiayai operasional berkelanjutan dengan biaya marginal rendah per penambahan wilayah.

## 25. Scalability *
Setiap penambahan provinsi **tidak memerlukan perubahan arsitektur inti** — cukup menambah *pipeline ingestion* data daerah bersangkutan. Arsitektur Docker Compose memudahkan replikasi dan *horizontal scaling*; TimescaleDB menangani data *time-series* jutaan baris secara efisien; ML service punya kontrol kapasitas untuk beban paralel. Hal ini menjadikan TOMOE 2.0 **skalabel secara nasional dengan biaya marginal rendah**. Pengembangan ke depan: integrasi API Pemda, prediksi berbasis data cuaca, dan perluasan cakupan komoditas.

## 26. Partnership & Distribution *
- **Mitra utama:** Bank Indonesia (Provinsi Sulawesi Tengah sebagai pilot), TPID, serta potensi Kemendag/Kementan untuk sumber data dan kanal intervensi.
- **Strategi distribusi:** mulai dari pilot internal di satu provinsi → replikasi bertahap ke Pemda lain melalui model B2G → distribusi kode sebagai open-source untuk adopsi luas. Peran mitra: penyedia data, validasi lapangan (TPID), dan kanal eksekusi kebijakan.

## 27. Problem–Market Fit *
Masalah ini sangat penting bagi target pengguna karena pengendalian inflasi adalah **mandat inti Bank Indonesia & TPID**, dan keterlambatan deteksi berdampak langsung pada daya beli masyarakat — terutama kelompok rentan yang membelanjakan >60% pendapatannya untuk pangan. Kebutuhan akan deteksi dini terbukti nyata: lonjakan inflasi Feb 2026 (4,76% YoY) memperlihatkan sistem reaktif gagal mengantisipasi tekanan harga musiman.

## 28. Evidence of Demand *
- **Bukti makro:** inflasi Feb 2026 melonjak 4,76% (YoY) melampaui target 2,5±1%, menegaskan keterbatasan sistem pemantauan reaktif yang ada.
- **Bukti kebijakan:** strategi 4K TPIP/TPID secara eksplisit menuntut pemantauan ekspektasi & harga yang lebih dini (rujukan pedoman TPIP/TPID dan kerangka EWS Inflasi Bappenas).
- **Bukti gap kompetitif:** solusi eksisting (Dashboard Kemendag, SISKAPERBAPO) hanya historis/lokal tanpa forecasting maupun sentimen — celah yang langsung diisi TOMOE 2.0.
- **Bukti riset:** literatur prediksi inflasi (ELM, SVR/LSTM, EGARCH) dan kerangka *nowcasting* EWS mendukung kelayakan pendekatan.

## 29. Target Market *
- **Primer:** Bank Indonesia (kantor pusat & perwakilan daerah) dan **TPID** sebagai pengguna analitik & koordinasi.
- **Sekunder:** Kementerian/lembaga terkait pengendalian harga (Kemendag, Kementan) dan Pemda.
- **Pilot awal:** ekosistem pengendalian inflasi **Provinsi Sulawesi Tengah**.

## 30. Adoption Readiness *
Adopsi mudah karena: (1) **berbasis web** — diakses lewat browser tanpa instalasi; (2) **dashboard intuitif** dengan ringkasan kondisi inflasi di satu halaman dan notifikasi otomatis; (3) **selaras alur kerja TPID** yang sudah ada (melengkapi, bukan menggantikan); (4) **kontrol akses berbasis peran** (viewer/analis/admin) sehingga sesuai struktur organisasi. Hambatan adopsi rendah karena data bersumber dari kanal resmi yang sudah dikenal pengguna.

## 31. Progress Since the 1st Submission *
Perkembangan sejak submission Tahap 1 (dari tahap *concept note* menuju MVP fungsional):
- **Codebase MVP terbangun:** dari konsep/ideasi menjadi aplikasi yang dapat dijalankan (stack ter-*dockerize* dan berjalan).
- **Frontend lengkap:** 10 halaman dashboard Next.js 14 (Dashboard, Analytics, Early Warning, Laporan, Forecasting, Komoditas, Sentimen, Geospatial, Pengaturan, Bantuan) + lapisan API/BFF, RBAC, dan audit logging.
- **ML service operasional (FastAPI):** forecasting SARIMA/LSTM/ensemble, sentimen IndoBERT, topik BERTopic, dan EWS (2-sigma + detektor robust median/MAD), lengkap dengan auth API-key, kontrol kapasitas/timeout, dan caching.
- **Database:** skema PostgreSQL + TimescaleDB 12 tabel beserta data *seed*.
- **Pipeline ingestion:** scraper PIHPS & BPS, modul *quality* (deduplikasi/validasi), *db_writer*, dan *scheduler* harian.
- **Hardening produksi:** keamanan (API-key, RBAC, audit), integritas ETL, dan robustness ML diperkuat; tersedia compose dev & prod.
- **Design system:** sistem desain *soft-fintech* (palet biru) diterapkan menyeluruh pada frontend.
- **Keputusan teknis (update workflow):** frontend diimplementasikan dengan **Next.js 14 + TypeScript + Tailwind** (menggantikan rencana awal Laravel/Blade) demi ekosistem visualisasi data yang lebih kaya dan kecepatan pengembangan tim; backend tetap **Python/FastAPI** dengan **PostgreSQL/TimescaleDB**.

## 32. Current Status *
**Prototype → MVP fungsional (pra-semifinal).** Arsitektur sistem, ML service, pipeline ingestion, dan dashboard sudah terbangun dan berjalan di lingkungan Docker. Tahap saat ini: integrasi data riil Sulteng, kalibrasi ambang *early warning*, dan persiapan demo MVP live sesuai timeline Fase 4 (Juni 2026).

---

## Attachment
- **Link Attachment (URL):** Prototype dashboard — https://inflation-tracker.github.io/TOMOE-2.0-Prototype/
- **File Attachment:** unggah PDF proposal dengan penamaan **`<ID Tim> - <Judul Proposal>.pdf`** (maks. 5MB).
