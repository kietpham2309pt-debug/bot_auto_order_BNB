// Gửi 1 tin "hello" nhanh để verify bot/chat hoạt động.
// Dùng env vars từ .env — KHÔNG hard-code token.
const telegram = require('../src/telegram');

(async () => {
  try {
    await telegram.sendOrderNotification(
      '✅ Bot kết nối thành công vào group. Đang setup webhook & KPI...'
    );
    console.log('Đã gửi.');
  } catch (e) {
    console.error('Lỗi:', e.response?.data || e.message);
    process.exit(1);
  }
})();
