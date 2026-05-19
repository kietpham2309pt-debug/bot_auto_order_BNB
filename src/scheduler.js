const cron = require('node-cron');
const config = require('./config');
const kpiSvc = require('./kpi');
const formatters = require('./formatters');
const telegram = require('./telegram');

async function safeSend(label, buildText) {
  try {
    const stats = await kpiSvc.computeKpiStats();
    const text = buildText(stats);
    await telegram.sendKpiNotification(text);
    console.log(`[cron] ${label} sent OK`);
  } catch (err) {
    console.error(`[cron] ${label} FAILED:`, err.message);
  }
}

function startScheduler() {
  const tz = config.server.timezone;

  cron.schedule(config.cron.morning, () => safeSend('KPI morning', formatters.formatKpiMorning), { timezone: tz });
  cron.schedule(config.cron.midshift, () => safeSend('KPI midshift', formatters.formatKpiMidshift), { timezone: tz });
  cron.schedule(config.cron.evening, () => safeSend('KPI evening', formatters.formatKpiEvening), { timezone: tz });

  console.log(`[cron] scheduled morning="${config.cron.morning}" midshift="${config.cron.midshift}" evening="${config.cron.evening}" (tz=${tz})`);
}

module.exports = { startScheduler, safeSend };
