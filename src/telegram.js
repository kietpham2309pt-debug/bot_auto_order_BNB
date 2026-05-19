const axios = require('axios');
const config = require('./config');

const API_BASE = `https://api.telegram.org/bot${config.telegram.botToken}`;

async function sendMessage(chatId, text, options = {}) {
  try {
    const { data } = await axios.post(`${API_BASE}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disablePreview ?? true,
      ...options.extra
    }, { timeout: 15000 });
    return data;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[telegram] sendMessage failed:', JSON.stringify(detail));
    throw err;
  }
}

const sendOrderNotification = (text) =>
  sendMessage(config.telegram.chatIdOrders, text);

const sendKpiNotification = (text) =>
  sendMessage(config.telegram.chatIdKpi, text);

async function getMe() {
  const { data } = await axios.get(`${API_BASE}/getMe`, { timeout: 10000 });
  return data;
}

module.exports = { sendMessage, sendOrderNotification, sendKpiNotification, getMe };
