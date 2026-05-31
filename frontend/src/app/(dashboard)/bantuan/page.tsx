export const metadata = { title: 'Bantuan — TOMOE 2.0' }

const faqs = [
  { q: 'Apa itu TOMOE 2.0?', a: 'TOMOE (Tracking & Monitoring Of Emerging Inflation) 2.0 adalah sistem deteksi dini inflasi berbasis AI yang dikembangkan untuk membantu TPID (Tim Pengendalian Inflasi Daerah) nasional dalam memantau, menganalisis, dan memprediksi tekanan inflasi di 34 provinsi Indonesia secara real-time.' },
  { q: 'Dari mana data harga komoditas berasal?', a: 'Data harga bersumber dari PIHPS (Pusat Informasi Harga Pangan Strategis) Bank Indonesia yang mencatat harga harian dari pasar-pasar tradisional di seluruh Indonesia, diperbarui setiap pagi pukul 06:00 WITA.' },
  { q: 'Apa yang dimaksud Early Warning System (EWS)?', a: 'EWS memantau tiga jenis sinyal: (1) 2-Sigma Alert — harga melebihi ±2 standar deviasi dari rata-rata historis; (2) Forecast Breach — harga aktual melampaui batas atas CI model prediksi; (3) Sentiment Spike — lonjakan sentimen negatif dari analisis media sosial.' },
  { q: 'Bagaimana model forecasting bekerja?', a: 'TOMOE menggunakan tiga model: SARIMA untuk menangkap pola musiman, LSTM (deep learning) untuk tren non-linear jangka panjang, dan model Ensemble yang menggabungkan keduanya untuk akurasi optimal (MAPE rata-rata 3-5%).' },
  { q: 'Apa itu analisis sentimen IndoBERT?', a: 'Analisis sentimen menggunakan model IndoBERT (BERT yang dilatih dengan corpus Bahasa Indonesia) untuk mengklasifikasi opini publik dari media sosial dan berita sebagai positif, netral, atau negatif terhadap komoditas pangan tertentu.' },
  { q: 'Kapan data dashboard diperbarui?', a: 'Data harga komoditas: setiap hari pukul 06:00 WITA. Data sentimen & berita: setiap 15 menit. Model forecast dijalankan ulang setiap hari setelah data terbaru masuk. IHK resmi BPS: bulanan sesuai rilis BPS.' },
]

export default async function BantuanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bantuan</h1>
        <p className="text-sm text-gray-500">Panduan penggunaan dan dokumentasi TOMOE 2.0.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: '📊', label: 'Panduan Dashboard', desc: 'Cara membaca indikator utama' },
          { icon: '⚡', label: 'Panduan EWS', desc: 'Merespons peringatan dini' },
          { icon: '🤖', label: 'Dokumentasi Model', desc: 'Metodologi AI & ML' },
          { icon: '📞', label: 'Hubungi Tim', desc: 'Support teknis TOMOE' },
        ].map((q) => (
          <div key={q.label} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-red-200 hover:bg-red-50 transition-colors">
            <span className="text-2xl">{q.icon}</span>
            <p className="mt-2 text-xs font-semibold text-gray-800">{q.label}</p>
            <p className="text-[10px] text-gray-400">{q.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Pertanyaan Umum (FAQ)</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {faqs.map((faq, i) => (
            <div key={i} className="px-4 py-4">
              <p className="text-sm font-semibold text-gray-800 mb-1.5">Q: {faq.q}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Tech Stack TOMOE 2.0</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { layer: 'Frontend', tech: 'Next.js 14, TypeScript, TailwindCSS, Recharts, TanStack Query, Zustand' },
            { layer: 'Backend API', tech: 'Next.js API Routes (BFF), Zod validation, PostgreSQL + TimescaleDB' },
            { layer: 'ML Service', tech: 'Python, FastAPI, SARIMA (statsmodels), LSTM (TensorFlow), IndoBERT, BERTopic' },
            { layer: 'Data Ingestion', tech: 'Python scrapers, APScheduler, PIHPS BI API, BPS WebAPI' },
            { layer: 'Infrastructure', tech: 'Docker, docker-compose, Redis cache, Vercel (frontend), VPS (ML+DB)' },
            { layer: 'Monitoring', tech: 'Early Warning System 2-sigma, Forecast CI breach, Sentiment spike detection' },
          ].map((s) => (
            <div key={s.layer} className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">{s.layer}</p>
              <p className="text-xs text-gray-600">{s.tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
