/* ═══════════════════════════════════════════════
   TOMOE 2.0 — Main JavaScript
   app.js
═══════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────
   1. CLOCK
───────────────────────────────────── */
function tick() {
  const now = new Date();
  const clockEl = document.getElementById('live-clock');
  const dateEl  = document.getElementById('date-display');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('id-ID', {
    timeZone:'Asia/Jakarta', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }) + ' WIB';
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', {
    timeZone:'Asia/Jakarta', weekday:'short', day:'numeric', month:'long', year:'numeric'
  });
}
tick();
setInterval(tick, 1000);

/* ─────────────────────────────────────
   2. NAVIGATION
───────────────────────────────────── */
const chartInstances = {};

function navigate(viewId) {
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewId);
  });

  // Toggle views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('view-active', v.id === viewId);
  });

  // Update topbar page title
  const titles = {
    'view-dashboard':    { h: 'Selamat Datang, Tim TOMOE 👋', p: 'Monitor dan kendalikan pergerakan harga komoditas secara real-time.' },
    'view-analytics':    { h: 'Analytics', p: 'Analisis mendalam pergerakan inflasi dan komoditas.' },
    'view-early-warning':{ h: 'Early Warning', p: 'Peringatan dini tekanan harga per wilayah dan komoditas.' },
    'view-laporan':      { h: 'Laporan', p: 'Unduh dan bagikan laporan inflasi periodik.' },
    'view-forecasting':  { h: 'Forecasting', p: 'Proyeksi harga komoditas 7, 14, dan 30 hari ke depan.' },
    'view-komoditas':    { h: 'Komoditas', p: 'Data harga harian 11 kelompok komoditas nasional.' },
    'view-sentimen':     { h: 'Sentimen Publik', p: 'Analisis opini masyarakat dari media sosial dan berita.' },
    'view-geospatial':   { h: 'Geospatial', p: 'Peta risiko inflasi per wilayah kabupaten/kota.' },
    'view-pengaturan':   { h: 'Pengaturan', p: 'Konfigurasi sistem dan preferensi notifikasi.' },
    'view-bantuan':      { h: 'Bantuan', p: 'Panduan penggunaan dan dokumentasi TOMOE 2.0.' },
  };

  const t = titles[viewId];
  if (t) {
    const h1 = document.querySelector('.page-title-h');
    const p  = document.querySelector('.page-title-p');
    if (h1) h1.textContent = t.h;
    if (p)  p.textContent  = t.p;
  }

  // Lazy init charts for the activated view
  setTimeout(() => initChartsForView(viewId), 50);
}

document.querySelectorAll('.nav-item[data-view]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.view));
});

/* ─────────────────────────────────────
   3. SIDEBAR COLLAPSE
───────────────────────────────────── */
document.querySelector('.collapse-btn')?.addEventListener('click', function () {
  document.querySelector('.sidebar').classList.toggle('collapsed');
  this.textContent = document.querySelector('.sidebar').classList.contains('collapsed') ? '»' : '«';
});

/* ─────────────────────────────────────
   4. CHART HELPERS
───────────────────────────────────── */
const chartDefaults = {
  font: { family: 'JetBrains Mono' },
  gridColor: 'rgba(0,0,0,0.04)',
  tickColor: '#9aa5b4',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e9ef',
};

function baseScales(minY, maxY) {
  return {
    x: {
      grid: { color: chartDefaults.gridColor },
      ticks: { color: chartDefaults.tickColor, font: { family: chartDefaults.font.family, size: 9 }, maxTicksLimit: 8, maxRotation: 0 },
      border: { color: '#e5e9ef' },
    },
    y: {
      grid: { color: chartDefaults.gridColor },
      ticks: { color: chartDefaults.tickColor, font: { family: chartDefaults.font.family, size: 9 }, callback: v => v.toFixed(1) + '%' },
      border: { color: '#e5e9ef' },
      min: minY, max: maxY,
    },
  };
}

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

/* ─────────────────────────────────────
   5. CHART INIT PER VIEW
───────────────────────────────────── */
function initChartsForView(viewId) {
  if (viewId === 'view-dashboard')     initDashboardCharts();
  if (viewId === 'view-analytics')     initAnalyticsCharts();
  if (viewId === 'view-forecasting')   initForecastingCharts();
  if (viewId === 'view-sentimen')      initSentimenCharts();
  if (viewId === 'view-geospatial')    initGeospatialCharts();
  if (viewId === 'view-early-warning') initEarlyWarningCharts();
}

/* ─── DASHBOARD ─── */
function initDashboardCharts() {
  if (chartInstances['dash-forecast']) return;

  const labels   = ['18/2','22/2','26/2','1/3','5/3','9/3','13/3','17/3','21/3','25/3','|','29/3','2/4','6/4','10/4'];
  const actual   = [2.60,2.72,2.85,2.90,3.05,3.10,3.12,3.12,3.12,3.12,null,null,null,null,null];
  const forecast = [null,null,null,null,null,null,null,null,null,3.12,3.18,3.28,3.42,3.58,3.70];
  const ciHigh   = [null,null,null,null,null,null,null,null,null,3.12,3.35,3.60,3.85,4.05,4.30];
  const ciLow    = [null,null,null,null,null,null,null,null,null,3.12,3.00,2.95,2.98,3.10,3.10];
  const tHigh    = Array(15).fill(3.5);
  const tLow     = Array(15).fill(1.5);

  const fCtx = document.getElementById('dashForecastChart');
  if (!fCtx) return;

  chartInstances['dash-forecast'] = new Chart(fCtx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [
      { label:'Aktual',  data:actual,   borderColor:'#22a05a', borderWidth:2.5, pointRadius:3, pointBackgroundColor:'#22a05a', tension:0.4, fill:false, spanGaps:false },
      { label:'Forecast',data:forecast, borderColor:'#ef4444', borderWidth:2,   borderDash:[5,4], pointRadius:3, pointBackgroundColor:'#ef4444', tension:0.4, fill:false, spanGaps:false },
      { label:'CI Hi',   data:ciHigh,   borderColor:'rgba(0,0,0,0)', backgroundColor:'rgba(239,68,68,0.08)', borderWidth:0, pointRadius:0, tension:0.4, fill:'+1', spanGaps:false },
      { label:'CI Lo',   data:ciLow,    borderColor:'rgba(0,0,0,0)', backgroundColor:'rgba(239,68,68,0.08)', borderWidth:0, pointRadius:0, tension:0.4, fill:false, spanGaps:false },
      { label:'Limit+',  data:tHigh,    borderColor:'rgba(239,68,68,0.4)',  borderWidth:1.5, borderDash:[4,3], pointRadius:0, fill:false },
      { label:'Limit-',  data:tLow,     borderColor:'rgba(54,162,235,0.4)', borderWidth:1.5, borderDash:[4,3], pointRadius:0, fill:false },
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins: {
        legend:{ display:false },
        tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, titleColor:'#4a5568', bodyColor:'#0f1923', titleFont:{family:'JetBrains Mono',size:10}, bodyFont:{family:'JetBrains Mono',size:11}, padding:10,
          callbacks:{ label: ctx => { if(ctx.parsed.y===null)return null; const m=['Aktual','Forecast','','','Limit+','Limit-']; const n=m[ctx.datasetIndex]||''; return n?` ${n}: ${ctx.parsed.y.toFixed(2)}%`:null; } }
        },
      },
      scales: baseScales(1.0, 5.0),
    },
  });

  // Sentiment donut
  if (chartInstances['dash-sentiment']) return;
  const sCtx = document.getElementById('dashSentimentChart');
  if (!sCtx) return;

  chartInstances['dash-sentiment'] = new Chart(sCtx.getContext('2d'), {
    type: 'doughnut',
    data: { labels:['Negatif','Netral','Positif'], datasets:[{ data:[62,25,13], backgroundColor:['#ef4444','#f59e0b','#22a05a'], borderColor:'#fff', borderWidth:3, hoverOffset:4 }] },
    options: {
      responsive:true, maintainAspectRatio:true, cutout:'68%',
      plugins: {
        legend:{ position:'right', labels:{ color:'#4a5568', font:{family:'Plus Jakarta Sans',size:11,weight:'600'}, padding:10, boxWidth:10, boxHeight:10 } },
        tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, bodyFont:{family:'JetBrains Mono',size:11}, padding:8, callbacks:{ label:ctx=>` ${ctx.label}: ${ctx.parsed}%` } },
      },
    },
    plugins:[{ id:'center', beforeDraw(c){
      const {chartArea:{left,right,top,bottom},ctx}=c;
      const cx=left+(right-left)/2, cy=top+(bottom-top)/2;
      ctx.save(); ctx.font='bold 20px JetBrains Mono'; ctx.fillStyle='#dc2626'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('62%',cx-22,cy-5); ctx.font='600 9px Plus Jakarta Sans'; ctx.fillStyle='#9aa5b4'; ctx.fillText('NEGATIF',cx-22,cy+11); ctx.restore();
    }}],
  });
}

/* ─── ANALYTICS ─── */
function initAnalyticsCharts() {
  if (chartInstances['ana-yoy']) return;

  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const yoy2024 = [2.57,2.75,3.05,3.00,2.84,2.51,2.13,2.12,1.84,1.71,1.55,1.57];
  const yoy2025 = [2.21,2.43,2.65,2.81,2.90,2.85,2.70,2.80,2.90,3.00,3.08,3.10];
  const yoy2026 = [3.12,null,null,null,null,null,null,null,null,null,null,null];

  const ctx = document.getElementById('anaYoYChart');
  if (!ctx) return;
  chartInstances['ana-yoy'] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels: months, datasets: [
      { label:'2024', data:yoy2024, borderColor:'#9aa5b4', borderWidth:1.5, pointRadius:2, tension:0.4, fill:false },
      { label:'2025', data:yoy2025, borderColor:'#22a05a', borderWidth:2, pointRadius:2, tension:0.4, fill:false },
      { label:'2026', data:yoy2026, borderColor:'#ef4444', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#ef4444', tension:0.4, fill:false, spanGaps:false },
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ font:{family:'Plus Jakarta Sans',size:11}, color:'#4a5568', padding:14, boxWidth:12, boxHeight:12 } },
        tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, bodyFont:{family:'JetBrains Mono',size:11}, padding:10, callbacks:{ label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)}%` } }
      },
      scales: baseScales(1.0, 4.5),
    },
  });

  // Bar chart - komoditas andil inflasi
  const bCtx = document.getElementById('anaKomoditasChart');
  if (!bCtx) return;
  chartInstances['ana-komoditas'] = new Chart(bCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Beras','Cabai','Bawang','Minyak','Daging','Telur','Gula'],
      datasets:[{
        label: 'Andil MtM (%)',
        data: [0.28, 0.54, 0.31, 0.12, 0.18, -0.05, -0.02],
        backgroundColor: ctx => ctx.raw >= 0 ? 'rgba(239,68,68,0.7)' : 'rgba(34,160,90,0.7)',
        borderRadius: 5,
      }],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, bodyFont:{family:'JetBrains Mono',size:11}, padding:10, callbacks:{ label:ctx=>` Andil: ${ctx.parsed.y.toFixed(2)}%` } } },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:10}}, border:{color:'#e5e9ef'} },
        y: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:10}, callback:v=>v.toFixed(2)+'%'}, border:{color:'#e5e9ef'} },
      },
    },
  });
}

/* ─── FORECASTING ─── */
function initForecastingCharts() {
  if (chartInstances['fc-main']) return;

  const labels = ['25/3','26/3','27/3','28/3','29/3','30/3','31/3','1/4','2/4','3/4','4/4','5/4','6/4','7/4','8/4','9/4','10/4'];
  const beras_actual   = [14800,14820,14830,14850,14870,14880,14890,null,null,null,null,null,null,null,null,null,null];
  const beras_forecast = [null,null,null,null,null,null,14890,14920,14980,15040,15100,15150,15200,15240,15280,15300,15320];
  const beras_hi       = [null,null,null,null,null,null,14890,15050,15200,15380,15500,15620,15740,15830,15920,15980,16040];
  const beras_lo       = [null,null,null,null,null,null,14890,14790,14760,14700,14700,14680,14660,14650,14640,14620,14600];

  const ctx = document.getElementById('fcMainChart');
  if (!ctx) return;
  chartInstances['fc-main'] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [
      { label:'Aktual',   data:beras_actual,   borderColor:'#22a05a', borderWidth:2.5, pointRadius:3, pointBackgroundColor:'#22a05a', tension:0.3, fill:false, spanGaps:false },
      { label:'Forecast', data:beras_forecast, borderColor:'#ef4444', borderWidth:2,   borderDash:[5,4], pointRadius:3, pointBackgroundColor:'#ef4444', tension:0.3, fill:false, spanGaps:false },
      { label:'CI Hi',    data:beras_hi,       borderColor:'rgba(0,0,0,0)', backgroundColor:'rgba(239,68,68,0.07)', borderWidth:0, pointRadius:0, tension:0.3, fill:'+1', spanGaps:false },
      { label:'CI Lo',    data:beras_lo,       borderColor:'rgba(0,0,0,0)', backgroundColor:'rgba(239,68,68,0.07)', borderWidth:0, pointRadius:0, tension:0.3, fill:false, spanGaps:false },
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, titleFont:{family:'JetBrains Mono',size:10}, bodyFont:{family:'JetBrains Mono',size:11}, padding:10,
        callbacks:{ label:ctx=>{ if(ctx.parsed.y===null)return null; const m=['Aktual','Forecast','','']; const n=m[ctx.datasetIndex]; return n?` ${n}: Rp ${ctx.parsed.y.toLocaleString('id-ID')}`:null; } }
      }},
      scales:{
        x:{ grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9},maxTicksLimit:10,maxRotation:0}, border:{color:'#e5e9ef'} },
        y:{ grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9}, callback:v=>'Rp '+v.toLocaleString('id-ID')}, border:{color:'#e5e9ef'} },
      },
    },
  });
}

/* ─── SENTIMEN ─── */
function initSentimenCharts() {
  const commodities = [
    { id:'sent-cabai',  label:'Cabai 🌶',  neg:78, neu:14, pos:8  },
    { id:'sent-beras',  label:'Beras 🌾',  neg:55, neu:26, pos:19 },
    { id:'sent-minyak', label:'Minyak 🛢', neg:40, neu:35, pos:25 },
    { id:'sent-telur',  label:'Telur 🥚',  neg:22, neu:28, pos:50 },
  ];

  commodities.forEach(c => {
    if (chartInstances[c.id]) return;
    const ctx = document.getElementById(c.id);
    if (!ctx) return;
    chartInstances[c.id] = new Chart(ctx.getContext('2d'), {
      type:'doughnut',
      data:{ labels:['Negatif','Netral','Positif'], datasets:[{ data:[c.neg,c.neu,c.pos], backgroundColor:['#ef4444','#f59e0b','#22a05a'], borderColor:'#fff', borderWidth:2, hoverOffset:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'70%',
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, bodyFont:{family:'JetBrains Mono',size:11}, padding:8, callbacks:{ label:ctx=>` ${ctx.label}: ${ctx.parsed}%` } } }
      },
      plugins:[{ id:'center', beforeDraw(chart){
        const {chartArea:{left,right,top,bottom},ctx:c2}=chart;
        const cx=left+(right-left)/2, cy=top+(bottom-top)/2;
        c2.save(); c2.font='bold 16px JetBrains Mono'; c2.fillStyle='#dc2626'; c2.textAlign='center'; c2.textBaseline='middle';
        c2.fillText(chart.data.datasets[0].data[0]+'%',cx,cy-4);
        c2.font='500 8px Plus Jakarta Sans'; c2.fillStyle='#9aa5b4';
        c2.fillText('NEGATIF',cx,cy+10); c2.restore();
      }}],
    });
  });

  // Timeline chart sentimen
  if (chartInstances['sent-timeline']) return;
  const tCtx = document.getElementById('sentTimelineChart');
  if (!tCtx) return;
  const days = Array.from({length:30},(_,i)=>{ const d=new Date('2026-02-25'); d.setDate(d.getDate()+i); return `${d.getDate()}/${d.getMonth()+1}`; });
  chartInstances['sent-timeline'] = new Chart(tCtx.getContext('2d'), {
    type:'line',
    data:{ labels:days, datasets:[
      { label:'Negatif', data:Array.from({length:30},(_,i)=>40+Math.sin(i*0.5)*15+Math.random()*8), borderColor:'#ef4444', borderWidth:2, pointRadius:0, tension:0.4, fill:true, backgroundColor:'rgba(239,68,68,0.06)' },
      { label:'Positif', data:Array.from({length:30},(_,i)=>25-Math.sin(i*0.5)*10+Math.random()*5), borderColor:'#22a05a', borderWidth:2, pointRadius:0, tension:0.4, fill:true, backgroundColor:'rgba(34,160,90,0.06)' },
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top', labels:{font:{family:'Plus Jakarta Sans',size:11},color:'#4a5568',padding:14,boxWidth:12,boxHeight:12}},
        tooltip:{backgroundColor:'#fff',borderColor:'#e5e9ef',borderWidth:1,bodyFont:{family:'JetBrains Mono',size:11},padding:10, callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}%`}}
      },
      scales:{
        x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9},maxTicksLimit:10,maxRotation:0},border:{color:'#e5e9ef'}},
        y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9},callback:v=>v+'%'},border:{color:'#e5e9ef'},min:0,max:80},
      },
    },
  });
}

/* ─── GEOSPATIAL ─── */
function initGeospatialCharts() {
  if (chartInstances['geo-bar']) return;
  const ctx = document.getElementById('geoBarChart');
  if (!ctx) return;
  chartInstances['geo-bar'] = new Chart(ctx.getContext('2d'), {
    type:'bar',
    data:{
      labels:['Jawa Timur','Sulsel','DKI Jakarta','Kaltim','NTT','Jawa Barat','Sumut','DIY','Kaltara','Babel'],
      datasets:[{ label:'Risk Score', data:[87,81,74,68,52,48,45,42,38,35],
        backgroundColor: d => { const v=d.raw; return v>=70?'rgba(239,68,68,0.75)':v>=50?'rgba(217,119,6,0.75)':'rgba(34,160,90,0.75)'; },
        borderRadius:5 }],
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, bodyFont:{family:'JetBrains Mono',size:11}, padding:10, callbacks:{label:ctx=>` Skor: ${ctx.parsed.x}`} } },
      scales:{
        x:{ grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9}}, border:{color:'#e5e9ef'}, min:0, max:100 },
        y:{ grid:{display:false}, ticks:{color:'#4a5568',font:{family:'Plus Jakarta Sans',size:11,weight:'600'}}, border:{color:'#e5e9ef'} },
      },
    },
  });
}

/* ─── EARLY WARNING ─── */
function initEarlyWarningCharts() {
  if (chartInstances['ew-timeline']) return;
  const ctx = document.getElementById('ewTimelineChart');
  if (!ctx) return;
  const days14 = Array.from({length:14},(_,i)=>{ const d=new Date('2026-03-12'); d.setDate(d.getDate()+i); return `${d.getDate()}/${d.getMonth()+1}`; });
  chartInstances['ew-timeline'] = new Chart(ctx.getContext('2d'), {
    type:'line',
    data:{labels:days14, datasets:[
      { label:'Jawa Timur', data:[68200,69500,70200,71000,72400,72800,74000,null,null,null,null,null,null,null], borderColor:'#ef4444', borderWidth:2.5, pointRadius:3, tension:0.3, fill:false, spanGaps:false },
      { label:'Forecast Jatim', data:[null,null,null,null,null,null,74000,75200,76800,78500,80200,82000,83500,85000], borderColor:'#ef4444', borderWidth:2, borderDash:[5,4], pointRadius:2, tension:0.3, fill:false },
      { label:'Sulawesi Selatan', data:[60000,60800,61500,62000,63200,63800,64500,null,null,null,null,null,null,null], borderColor:'#f97316', borderWidth:2, pointRadius:2, tension:0.3, fill:false, spanGaps:false },
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top',labels:{font:{family:'Plus Jakarta Sans',size:11},color:'#4a5568',padding:14,boxWidth:12,boxHeight:12}},
        tooltip:{ backgroundColor:'#fff', borderColor:'#e5e9ef', borderWidth:1, titleFont:{family:'JetBrains Mono',size:10}, bodyFont:{family:'JetBrains Mono',size:11}, padding:10,
          callbacks:{label:ctx=>{ if(ctx.parsed.y===null)return null; return ` ${ctx.dataset.label}: Rp ${ctx.parsed.y.toLocaleString('id-ID')}`; }}
        },
      },
      scales:{
        x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9},maxRotation:0},border:{color:'#e5e9ef'}},
        y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#9aa5b4',font:{family:'JetBrains Mono',size:9},callback:v=>'Rp '+v.toLocaleString('id-ID')},border:{color:'#e5e9ef'}},
      },
    },
  });
}

/* ─────────────────────────────────────
   6. CHART TAB SWITCHING
───────────────────────────────────── */
document.addEventListener('click', e => {
  const tab = e.target.closest('.chart-tab');
  if (!tab) return;
  const group = tab.closest('.chart-tabs');
  if (!group) return;
  group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
});

/* ─────────────────────────────────────
   7. COMMODITY PILL SELECTOR (Forecasting)
───────────────────────────────────── */
document.addEventListener('click', e => {
  const pill = e.target.closest('.com-pill');
  if (!pill) return;
  pill.closest('.commodity-selector').querySelectorAll('.com-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
});

/* ─────────────────────────────────────
   8. SETTINGS TOGGLES
───────────────────────────────────── */
document.addEventListener('click', e => {
  const toggle = e.target.closest('.toggle');
  if (!toggle) return;
  toggle.classList.toggle('on');
});

/* ─────────────────────────────────────
   9. INIT: Load dashboard by default
───────────────────────────────────── */
navigate('view-dashboard');
