const config = require('./config');
const kpiSvc = require('./kpi');
const telegram = require('./telegram');

function checkAuth(req) {
  const expected = config.cronSecret;
  if (!expected) return true;
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (auth === `Bearer ${expected}`) return true;
  const key = req.query?.key;
  if (typeof key === 'string' && key === expected) return true;
  return false;
}

async function runKpi(label, buildText, req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const stats = await kpiSvc.computeKpiStats();
    const text = buildText(stats);
    await telegram.sendKpiNotification(text);
    console.log(`[cron] ${label} sent OK`);
    return res.status(200).json({ ok: true, label, stats });
  } catch (err) {
    console.error(`[cron] ${label} FAILED:`, err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { runKpi };
