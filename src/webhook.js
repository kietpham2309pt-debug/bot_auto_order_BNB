const express = require('express');
const crypto = require('crypto');
const config = require('./config');
const formatters = require('./formatters');
const telegram = require('./telegram');

const router = express.Router();

// Lưu raw body để verify HMAC (Haravan ký HMAC SHA-256 base64 vào header X-Haravan-Hmac-Sha256)
const rawBodySaver = (req, _res, buf) => {
  if (buf?.length) req.rawBody = buf;
};

router.use(express.json({ verify: rawBodySaver, limit: '2mb' }));

function verifyHmac(req) {
  const secret = config.haravan.webhookSecret;
  if (!secret) return true; // không bật verify
  const headerSig = req.get('X-Haravan-Hmac-Sha256') || req.get('x-haravan-hmac-sha256');
  if (!headerSig || !req.rawBody) return false;
  const calc = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(headerSig), Buffer.from(calc));
  } catch {
    return false;
  }
}

router.post('/haravan/orders', async (req, res) => {
  if (!verifyHmac(req)) {
    console.warn('[webhook] HMAC verification failed');
    return res.status(401).json({ error: 'invalid_signature' });
  }

  // Trả 200 ngay để Haravan không retry
  res.status(200).json({ ok: true });

  const order = req.body;
  if (!order || !order.id) {
    console.warn('[webhook] payload thiếu id, bỏ qua');
    return;
  }

  try {
    const text = formatters.formatOrderMessage(order);
    await telegram.sendOrderNotification(text);
    console.log(`[webhook] đã gửi thông báo đơn ${order.name || order.id}`);
  } catch (err) {
    console.error('[webhook] lỗi gửi telegram:', err.message);
  }
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

module.exports = router;
