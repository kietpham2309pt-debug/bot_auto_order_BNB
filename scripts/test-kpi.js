// Gửi 3 tin KPI (morning, midshift, evening) - test format và verify Haravan API hoạt động
const formatters = require('../src/formatters');
const telegram = require('../src/telegram');
const { computeKpiStats } = require('../src/kpi');

(async () => {
  const mode = process.argv[2] || 'all'; // morning | midshift | evening | all
  console.log('Fetching KPI stats từ Haravan...');
  const stats = await computeKpiStats();
  console.log('Stats:', stats);

  const variants = {
    morning: formatters.formatKpiMorning,
    midshift: formatters.formatKpiMidshift,
    evening: formatters.formatKpiEvening
  };

  const toRun = mode === 'all' ? Object.keys(variants) : [mode];

  for (const v of toRun) {
    if (!variants[v]) continue;
    const text = variants[v](stats);
    console.log(`\n---${v.toUpperCase()}---\n${text}`);
    await telegram.sendKpiNotification(text);
  }
  console.log('\nĐã gửi.');
})().catch((e) => { console.error(e?.response?.data || e); process.exit(1); });
