// Gửi 1 tin nhắn đơn hàng giả vào Telegram để test format
const formatters = require('../src/formatters');
const telegram = require('../src/telegram');

const fakeOrder = {
  id: 1799815237,
  name: '#RT12510718',
  order_number: 12510718,
  source_name: 'web',
  email: 'nguyenhainam0024@gmail.com',
  phone: '0972583717',
  customer: { first_name: 'Nguyễn', last_name: 'Hải Nam', email: 'nguyenhainam0024@gmail.com' },
  gateway: 'Thanh toán khi giao hàng (COD)',
  financial_status: 'paid',
  subtotal_price: '673000',
  total_price: '673000',
  total_discounts: '0',
  discount_codes: [],
  created_at: '2026-05-08T16:49:43+07:00',
  shipping_lines: [{ title: 'Giao hàng tận nơi' }],
  user: { name: 'Không xác định' },
  line_items: [
    { title: 'Bột vệ sinh máy rửa chén 3 gói/hộp', quantity: 1, price: '328000', total_discount: '0' },
    { title: 'Dung dịch vệ sinh và bảo dưỡng máy rửa chén Bosch 250ml', quantity: 1, price: '345000', total_discount: '0' }
  ]
};

(async () => {
  const text = formatters.formatOrderMessage(fakeOrder);
  console.log('---PREVIEW---\n' + text + '\n---END---');
  await telegram.sendOrderNotification(text);
  console.log('Đã gửi.');
})().catch((e) => { console.error(e); process.exit(1); });
