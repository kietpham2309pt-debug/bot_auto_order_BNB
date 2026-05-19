const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const config = require('./config');
const haravan = require('./haravan');

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = config.server.timezone;

function monthBoundsVN(now = dayjs().tz(TZ)) {
  const startOfMonth = now.startOf('month');
  const endOfMonth = now.endOf('month');
  const startOfToday = now.startOf('day');
  const endOfToday = now.endOf('day');
  return {
    monthStartISO: startOfMonth.toISOString(),
    monthEndISO: endOfMonth.toISOString(),
    todayStartISO: startOfToday.toISOString(),
    todayEndISO: endOfToday.toISOString(),
    daysInMonth: endOfMonth.date(),
    today: now.date(),
    remainingDays: endOfMonth.date() - now.date() + 1,
    dateLabel: now.format('DD-MMM-YYYY')
  };
}

async function computeKpiStats() {
  const now = dayjs().tz(TZ);
  const b = monthBoundsVN(now);

  const monthTarget = config.kpi.monthlyTarget;
  const todayTarget = monthTarget > 0 ? Math.round(monthTarget / b.daysInMonth) : 0;

  const [achievedMTD, achievedToday] = await Promise.all([
    haravan.sumRevenueBetween(b.monthStartISO, b.monthEndISO),
    haravan.sumRevenueBetween(b.todayStartISO, b.todayEndISO)
  ]);

  const remainingMonth = Math.max(0, monthTarget - achievedMTD);
  const avgPerDayNeeded = b.remainingDays > 0 ? Math.round(remainingMonth / b.remainingDays) : 0;

  return {
    dateLabel: b.dateLabel,
    monthTarget,
    todayTarget,
    achievedMTD,
    achievedToday,
    remainingMonth,
    remainingDays: b.remainingDays,
    avgPerDayNeeded
  };
}

module.exports = { computeKpiStats, monthBoundsVN };
