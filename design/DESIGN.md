---
version: alpha
name: TOMOE 2.0
description: >
  Sistem desain untuk TOMOE 2.0 — Early Inflation Detection System.
  Estetika "soft fintech": terang, biru, lapang, angka tebal sebagai aksen.
  Identitas kanonik mengikuti dashboard portfolio-full.html (varian CashPanel).

colors:
  page: "#eef1f6"          # kanvas halaman
  surface: "#ffffff"       # panel / kartu
  surfaceSoft: "#f4f6fa"   # field, ikon bg, blob
  ink: "#1b2330"           # teks utama & angka
  inkSoft: "#3a4252"       # teks sekunder kuat
  muted: "#7c8595"         # teks sekunder
  faint: "#a7afbd"         # label kecil / placeholder
  line: "#e7eaf0"          # garis & border
  blue: "#3266f0"          # aksi primer, line chart
  blueSoft: "#e9effe"
  up: "#2bb37a"            # candle naik / nilai positif
  upSoft: "#e3f5ec"
  down: "#e0584f"          # candle turun / nilai negatif
  downSoft: "#fdebe9"
  yellow: "#f3c24b"        # status WATCH / medium
  purple: "#7b61ff"        # kategori (energi)
  warnText: "#9a7400"      # teks pada tag WATCH

typography:
  display:                 # H1 hero ("Inflasi Nasional")
    fontFamily: "SF Pro Display, -apple-system, Inter, sans-serif"
    fontSize: 72px         # responsif: clamp(44px, 5.6vw, 72px)
    fontWeight: 350
    lineHeight: 0.96
    letterSpacing: -0.04em
  numberXl:                # angka gauge
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 42px
    fontWeight: 700
    letterSpacing: -0.035em
    fontFeature: "tnum"
  numberLg:                # angka besar panel (penyumbang)
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 30px
    fontWeight: 750
    letterSpacing: -0.03em
    fontFeature: "tnum"
  numberMd:                # metric (MAPE, lead time)
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 26px
    fontWeight: 750
    letterSpacing: -0.03em
    fontFeature: "tnum"
  title:                   # judul panel
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 750
  body:
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 450
    lineHeight: 1.45
    fontFeature: "tnum"
  label:                   # label/caption muted
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 600
  caption:
    fontFamily: "SF Pro Display, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 600

rounded:
  field: 11px              # search, iconbtn
  chip: 12px               # segmented control, chip
  card: 20px               # panel
  shell: 26px              # app shell (varian shot)
  pill: 999px
  full: 50%

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 18px                  # gap grid & gutter kanonik
  6: 24px
  7: 28px
  8: 40px

components:
  navPillActive:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
  buttonSend:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: 38px
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: 18px
  field:
    backgroundColor: "{colors.surfaceSoft}"
    rounded: "{rounded.pill}"
  segActive:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: 9px
  chipPositive:
    backgroundColor: "{colors.upSoft}"
    textColor: "{colors.up}"
  chipNegative:
    backgroundColor: "{colors.downSoft}"
    textColor: "{colors.down}"
  tagHigh:
    backgroundColor: "{colors.downSoft}"
    textColor: "{colors.down}"
  tagWatch:
    backgroundColor: "#fbf2da"
    textColor: "{colors.warnText}"
  tagOk:
    backgroundColor: "{colors.upSoft}"
    textColor: "{colors.up}"
  chartCandleUp:
    backgroundColor: "{colors.up}"
  chartCandleDown:
    backgroundColor: "{colors.down}"
  chartLine:
    textColor: "{colors.blue}"
---

# DESIGN.md — TOMOE 2.0

> Format mengikuti spesifikasi **DESIGN.md** (Google Labs, `alpha`): YAML front matter = token
> normatif ("what"); body di bawah = rasional & aturan penerapan ("why").
> Token di atas adalah sumber kebenaran — bila prosa dan token bentrok, token menang.

## Overview

TOMOE 2.0 adalah **Early Inflation Detection System** (PIHPS BI / BPS / NLP IndoBERT /
Forecast Ensemble). Tab **Dashboard** = pemantauan inflasi **ringkas → terperinci → insight**.

Estetika: **soft fintech** — light mode, banyak ruang putih, aksen biru, angka tebal sebagai
titik fokus. Tenang dan presisi, bukan ramai.

Implementasi referensi:
- `portfolio-full.html` — **identitas kanonik** (full-page; semua token di atas berasal dari sini).
- `portfolio.html` — varian "shot" (kartu mengambang, shell radius 26px).
- `index.html` — varian **Eclipse** legacy (palet & nav berbeda; bukan acuan token ini).

Pemetaan domain (referensi visual → TOMOE): My Portfolio→Inflasi Nasional ·
Total portfolio value→Inflasi Umum YoY · Stock/Crypto→Volatile Food/Core ·
ticker kripto→komoditas (Cabai/Bawang/Beras) · Gain-to-pain→MAPE/Lead time/Cakupan ·
AI Assistant→Insight Otomatis · Transfers→Sinyal terbaru · Spending→Penyumbang inflasi.

## Colors

Warna dipakai **hemat dan bermakna**:
- `blue` hanya untuk **aksi** (tombol kirim, nav aktif) dan **line chart**.
- `up`/`down` hanya untuk **arah nilai** (naik/turun, positif/negatif) dan candle.
- `yellow` untuk status **WATCH/medium**; `purple` hanya penanda kategori.
- Selebihnya netral (`ink`/`muted`/`faint`/`line`) supaya aksen tidak kehilangan arti.
- Pasangan `*Soft` adalah latar tenang untuk chip/tag dengan teks warna penuh di atasnya.

## Typography

Satu font keluarga (system sans). Hierarki dibangun dari **kontras berat–ringan**, bukan banyak warna:
- **`display`**: H1 raksasa tapi **ringan (350)** → titik masuk lewat *ukuran*, bukan ketebalan.
- **`numberXl/Lg/Md`**: angka tebal (700–750) sebagai aksen sekunder.
- **`label/caption`**: kecil, muted, untuk konteks.

**Aturan keras — angka WAJIB pakai font utama (`fontFamily` di atas), bukan monospace.**
`fontFeature: "tnum"` di-set global pada `body`, jadi angka tetap tabular/rata kolom tanpa mono.
Berlaku untuk chip %, harga & delta tabel, tag, inisial avatar, dan footer.

## Layout & Spacing

- **Satu pembungkus `.wrap`** (max-width 1640px, `margin:auto`, padding `clamp(18px,3vw,40px)`)
  membungkus hero + semua baris. **Jangan** memberi `.wrap` per-section — pemusatan tiap section
  bisa *drift* di layar ultra-wide sehingga kartu atas–bawah tidak sebaris.
- **Grid 12 kolom bersama** untuk semua baris konten (`repeat(12, minmax(0,1fr))`, gap `spacing.5` = 18px):
  - Baris 1: chart `span 8` + Insight `span 4`.
  - Baris 2: tiga kartu `span 4`.
  - Efek: tepi kolom lurus atas-bawah (chart sejajar Sinyal+Komoditas; Insight sejajar Penyumbang).
- **Responsif**: `≤1080px` → 2 kolom (span→2); `≤720px` → 1 kolom (span→1).
- Topbar **sticky** + `backdrop-filter:blur`; area konten scroll terpisah.

## Elevation & Depth

Kedalaman dari **3 tingkat surface** + bayangan halus lebar (bukan drop-shadow tajam):

```
page #eef1f6  →  area  →  card #ffffff (rounded.card) + border line + shadow-sm
shadow:    0 24px 60px rgba(40,55,80,.10)   # hero / kartu menonjol
shadow-sm: 0 8px 24px  rgba(40,55,80,.05)   # panel standar
```
Semakin terang permukaan, semakin "naik" / penting. Kartu putih selalu duduk di atas `page`.

## Shapes

- **Kartu** `rounded.card` (20px); shell varian shot `rounded.shell` (26px).
- **Pill** `rounded.pill` untuk nav, tombol kapsul, chip status, field input, blob.
- **Chip/segmented** `rounded.chip` (12px), tombol aktif di dalamnya 9px.
- Tombol bulat (kirim, ikon) `rounded.full`.
- Aksen bentuk khas: **blob pill** bergaris (volatile food/core), **gauge setengah lingkaran**
  dengan arc gradient biru + titik di ujung, **area gradient** di bawah line chart.

## Components

- **Nav pill** (topbar): item aktif `navPillActive`; market chip dipisah garis kiri.
- **Tombol kirim / aksi**: `buttonSend` (biru, bulat).
- **Panel**: `panel` (putih, radius 20, border line, shadow-sm); header = ikon outline + `title` + tombol `↗`.
- **Chip delta**: `chipPositive` / `chipNegative` (mis. +8% / −8%).
- **Tag status tabel**: `tagHigh` / `tagWatch` / `tagOk`.
- **Segmented control**: timeframe (Tahun/Bulan/Minggu/Hari) & tipe chart; aktif = `segActive`.
- **Insight Otomatis** (pengganti AI copilot agar tetap MVP): ringkasan naratif + daftar **temuan
  utama** ber-dot warna + baris meta "live · diperbarui" + satu input "Tanya" ringkas (tanpa pemilih model).
- **Gauge**: setengah lingkaran, label kecil + `numberXl` + tombol View pill.
- **Chart harga** (dua mode, bisa di-toggle):
  - Digambar di **koordinat pixel asli** (baca `clientWidth`, set `viewBox` = lebar kontainer) →
    tidak melar di layar lebar; redraw saat resize (debounce 120ms) dengan **mode dipertahankan**.
  - **Candle**: `chartCandleUp/Down`, body `rounded` ~2.5px, wick 1.6px, titik highlight stroke `ink`.
  - **Line**: `chartLine` (biru) 2.6px rounded + area gradient biru `.18→0`, titik highlight stroke biru.
  - Grid dashed (`4 6`) + tooltip melayang (anchor ke titik aktif) konsisten di kedua mode.

## Do's and Don'ts

**Do**
- Pakai font utama untuk semua angka; andalkan `tnum` untuk perataan.
- Bungkus seluruh konten dalam **satu** `.wrap`; pakai **grid 12 kolom** lintas baris agar kartu sebaris.
- Gambar chart di pixel asli; pertahankan mode saat resize.
- Jaga tab Dashboard tetap **MVP**: ringkas (gauge+komponen+ticker) → terperinci (chart+metrik) →
  insight (Insight Otomatis, Sinyal, tabel komoditas, penyumbang).
- Pakai warna aksen seperlunya; sisanya netral.

**Don't**
- Jangan pakai **monospace** untuk angka/label.
- Jangan beri `.wrap`/pemusatan per-section (bikin baris atas–bawah meleset).
- Jangan `preserveAspectRatio="none"` pada chart (candle jadi gepeng).
- Jangan kembalikan panel copilot penuh (tab model + perintah) ke tab Dashboard — itu di luar MVP.
- Jangan tumpuk banyak warna kuat dalam satu area; aksen kehilangan makna.
