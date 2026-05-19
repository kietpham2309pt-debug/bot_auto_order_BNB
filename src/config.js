require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v.trim();
}

function optional(name, fallback) {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : fallback;
}

const config = {
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
    chatIdOrders: required('TELEGRAM_CHAT_ID_ORDERS'),
    chatIdKpi: optional('TELEGRAM_CHAT_ID_KPI', null) || required('TELEGRAM_CHAT_ID_ORDERS')
  },
  haravan: {
    domain: required('HARAVAN_SHOP_DOMAIN'),
    token: required('HARAVAN_API_TOKEN'),
    webhookSecret: optional('HARAVAN_WEBHOOK_SECRET', '')
  },
  showroomName: optional('SHOWROOM_NAME', 'Showroom'),
  kpi: {
    monthlyTarget: parseInt(optional('KPI_MONTHLY_TARGET', '0'), 10)
  },
  server: {
    port: parseInt(optional('PORT', '3001'), 10),
    timezone: optional('TIMEZONE', 'Asia/Ho_Chi_Minh')
  },
  cronSecret: optional('CRON_SECRET', '')
};

module.exports = config;
