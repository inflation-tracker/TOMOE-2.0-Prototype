export const metadata = { title: 'Pengaturan — TOMOE 2.0' }

const toggles = [
  { label: 'Notifikasi Early Warning', desc: 'Kirim alert ke email saat muncul peringatan baru', on: true },
  { label: 'Notifikasi Forecast Harian', desc: 'Ringkasan proyeksi inflasi setiap pagi pukul 07.00', on: true },
  { label: 'Mode Gelap', desc: 'Tampilan antarmuka tema gelap (coming soon)', on: false },
  { label: 'Auto Refresh Data', desc: 'Perbarui data dashboard otomatis setiap 15 menit', on: true },
  { label: 'Tampilkan Confidence Interval', desc: 'Tampilkan batas atas/bawah forecast di semua grafik', on: true },
]

export default async function PengaturanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500">Konfigurasi sistem dan preferensi notifikasi.</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Notifikasi */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Notifikasi & Alert</h2>
          <div className="space-y-3">
            {toggles.map((t) => (
              <div key={t.label} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">{t.label}</p>
                  <p className="text-[10px] text-gray-400">{t.desc}</p>
                </div>
                <button className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${t.on ? 'bg-red-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${t.on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Model Config */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Konfigurasi Model</h2>
          <div className="space-y-3">
            {[
              { label: 'Model Forecasting', value: 'Ensemble (SARIMA + LSTM)' },
              { label: 'Model Sentimen', value: 'IndoBERT (HuggingFace)' },
              { label: 'Model Topik', value: 'BERTopic c-TF-IDF' },
              { label: 'Update Jadwal', value: 'Setiap hari pukul 06:00 WITA' },
              { label: 'Threshold EWS', value: 'μ ± 2σ (standar deviasi)' },
              { label: 'Horizon Forecast', value: '7, 14, 30 hari' },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                <span className="text-xs text-gray-500">{c.label}</span>
                <span className="text-xs font-semibold text-gray-800 font-mono">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Manajemen Pengguna</h2>
          {[
            { name: 'Admin BI Sulteng', email: 'admin@bi.go.id', role: 'admin' },
            { name: 'Analis TPID', email: 'analyst@bi.go.id', role: 'analyst' },
            { name: 'Staf TPID', email: 'viewer@tpid.go.id', role: 'tpid' },
          ].map((u) => (
            <div key={u.email} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                {u.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">{u.name}</p>
                <p className="text-[10px] text-gray-400">{u.email}</p>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{u.role}</span>
            </div>
          ))}
          <button className="mt-3 w-full rounded-lg border border-dashed border-gray-200 py-2 text-xs text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors">
            + Tambah Pengguna
          </button>
        </div>

        {/* Data Source */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Sumber Data</h2>
          {[
            { source: 'PIHPS BI', status: 'active', desc: 'Harga komoditas harian', next: '06:00 WITA' },
            { source: 'BPS WebAPI', status: 'active', desc: 'IHK dan inflasi resmi', next: '01/Jun' },
            { source: 'Scraper Berita', status: 'active', desc: 'Media online Sulteng', next: 'Tiap 15 menit' },
            { source: 'Twitter/X API', status: 'active', desc: 'Sentimen media sosial', next: 'Tiap 15 menit' },
          ].map((s) => (
            <div key={s.source} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{s.source}</p>
                <p className="text-[10px] text-gray-400">{s.desc}</p>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{s.next}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
