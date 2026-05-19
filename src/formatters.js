const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const config = require('./config');

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = config.server.timezone;

const fmtMoney = (n) => {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('vi-VN');
};
const fmtMoneyVND = (n) => `${fmtMoney(n)} đ`;

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const paymentStatusMap = {
  pending: 'Chờ thanh toán',
  authorized: 'Đã xác thực',
  partially_paid: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  partially_refunded: 'Hoàn lại một phần',
  refunded: 'Đã hoàn tiền',
  voided: 'Đã hủy'
};

function formatOrderMessage(order) {
  const customer = order.customer || {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
                        order.billing_address?.name || order.shipping_address?.name || 'Khách lẻ';
  const email = order.email || customer.email || '';
  const phone = order.phone || customer.phone || order.shipping_address?.phone || order.billing_address?.phone || '';

  const paymentMethod = (order.gateway || order.payment_gateway_names?.[0] || 'Không xác định');
  const paymentStatusVi = paymentStatusMap[order.financial_status] || order.financial_status || '';

  const totalBeforeDiscount = parseFloat(order.subtotal_price || order.total_line_items_price || 0);
  const totalPaid = parseFloat(order.total_price || 0);
  const totalDiscount = parseFloat(order.total_discounts || 0);
  const coupon = (order.discount_codes || []).map((d) => d.code).filter(Boolean).join(', ');

  const createdAt = dayjs(order.created_at).tz(TZ).format('YYYY-MM-DD HH:mm:ss');

  const shippingMethod = order.shipping_lines?.[0]?.title || 'Giao hàng tận nơi';
  const staff = order.user?.name || order.staff?.name || 'Không xác định';

  const discountAppl = (order.discount_applications || order.discount_codes || [])
    .map((d) => d.title || d.code || '')
    .filter(Boolean)
    .join(', ');

  const lineItems = (order.line_items || []).map((li) => {
    const price = parseFloat(li.price || 0) * (li.quantity || 1) - parseFloat(li.total_discount || 0);
    return `${escapeHtml(li.title || li.name)} | SL: ${li.quantity} | Giá KH thanh toán: ${fmtMoney(price)}`;
  }).join('\n');

  const orderUrl = `https://${config.haravan.domain}/admin/orders/${order.id}`;
  const orderName = order.name || `#${order.order_number || order.id}`;

  return [
    `🛒 <b>Thông báo đơn hàng ${escapeHtml(config.showroomName)}</b>`,
    `#Thông báo đơn mới từ ${escapeHtml(config.showroomName)}`,
    ``,
    `Mã đơn hàng: <b>${escapeHtml(orderName)}</b>`,
    `Nguồn đơn hàng: ${escapeHtml(order.source_name || 'web')}`,
    `Khách hàng: ${escapeHtml(customerName)}`,
    email ? `Email: ${escapeHtml(email)}` : `Email:`,
    phone ? `Phone: ${escapeHtml(phone)}` : `Phone:`,
    `Phương thức thanh toán: ${escapeHtml(paymentMethod)}`,
    `Trạng thái thanh toán: ${escapeHtml(paymentStatusVi)}`,
    `Tổng đơn hàng chưa giảm giá: ${fmtMoney(totalBeforeDiscount)}`,
    `Tổng đơn hàng khách hàng thanh toán: ${fmtMoney(totalPaid)}`,
    `Tổng giảm giá : ${fmtMoney(totalDiscount)}`,
    `Coupon: ${escapeHtml(coupon)}`,
    `Ngày mua hàng: ${createdAt}`,
    `Phương thức giao hàng: ${escapeHtml(shippingMethod)}`,
    `Nhân viên bán hàng: ${escapeHtml(staff)}`,
    ``,
    `Khuyến mãi áp dụng: ${escapeHtml(discountAppl)}`,
    ``,
    `Sản phẩm:`,
    lineItems,
    ``,
    `Đơn hàng chi tiết: ${orderUrl}`
  ].join('\n');
}

// ===== KPI Formatters =====

function formatKpiMorning(stats) {
  const { monthTarget, todayTarget, achievedMTD, remainingMonth, remainingDays, avgPerDayNeeded, dateLabel } = stats;
  const pctMonth = monthTarget > 0 ? (achievedMTD / monthTarget) * 100 : 0;
  return [
    `📊 <b>KPI ngày mới</b> ${dateLabel}`,
    ``,
    `• <b>KPI tháng:</b> ${fmtMoneyVND(monthTarget)}`,
    `• <b>KPI hôm nay:</b> ${fmtMoneyVND(todayTarget)}`,
    ``,
    `• <b>Đã đạt:</b> ${fmtMoneyVND(achievedMTD)}`,
    `   = ${pctMonth.toFixed(2)}% KPI tháng`,
    ``,
    `• <b>KPI còn lại tháng:</b> ${fmtMoneyVND(remainingMonth)}`,
    `• <b>Số ngày còn lại:</b> ${remainingDays}`,
    `• <b>TB mỗi ngày cần đạt:</b> ${fmtMoneyVND(avgPerDayNeeded)}`
  ].join('\n');
}

function formatKpiMidshift(stats) {
  const { todayTarget, achievedToday, achievedMTD, monthTarget, remainingMonth } = stats;
  const pctToday = todayTarget > 0 ? (achievedToday / todayTarget) * 100 : 0;
  const pctMonth = monthTarget > 0 ? (achievedMTD / monthTarget) * 100 : 0;
  const lackToday = Math.max(0, todayTarget - achievedToday);
  return [
    `🟢 <b>KPI GIỮA CA</b>`,
    ``,
    `• <b>Đã đạt:</b> ${fmtMoneyVND(achievedToday)}`,
    `   = ${pctToday.toFixed(2)}% KPI ngày`,
    `   = ${pctMonth.toFixed(2)}% KPI tháng`,
    ``,
    `• <b>Còn thiếu hôm nay:</b> ${fmtMoneyVND(lackToday)}`,
    `• <b>KPI còn lại tháng:</b> ${fmtMoneyVND(remainingMonth)}`
  ].join('\n');
}

function formatKpiEvening(stats) {
  const { dateLabel, achievedToday, todayTarget, achievedMTD, monthTarget, remainingMonth, remainingDays, avgPerDayNeeded } = stats;
  const pctToday = todayTarget > 0 ? (achievedToday / todayTarget) * 100 : 0;
  const pctMonth = monthTarget > 0 ? (achievedMTD / monthTarget) * 100 : 0;
  const isCritical = pctToday < 50;
  return [
    `📊 <b>KPI DAILY ${dateLabel} ~ OFFICIAL</b>`,
    isCritical ? `🚨 <b>CRITICAL</b>` : `✅ <b>ON TRACK</b>`,
    `• <b>Doanh thu Hôm nay:</b> ${fmtMoneyVND(achievedToday)} ~ ${pctToday.toFixed(2)}%`,
    ``,
    `• <b>Doanh thu MTD:</b> ${fmtMoneyVND(achievedMTD)}`,
    `• <b>KPI tháng:</b> ${fmtMoneyVND(monthTarget)}`,
    `• <b>% hoàn thành tháng:</b> ${pctMonth.toFixed(2)}%`,
    ``,
    `• <b>KPI còn lại tháng:</b> ${fmtMoneyVND(remainingMonth)}`,
    `• <b>Ngày còn lại:</b> ${remainingDays}`,
    `• <b>TB cần đạt/ngày:</b> ${fmtMoneyVND(avgPerDayNeeded)}`
  ].join('\n');
}

module.exports = {
  formatOrderMessage,
  formatKpiMorning,
  formatKpiMidshift,
  formatKpiEvening,
  fmtMoney,
  fmtMoneyVND
};
