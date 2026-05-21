const crypto = require('crypto');
const config = require('../../../src/config');
const formatters = require('../../../src/formatters');
const telegram = require('../../../src/telegram');

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function verifyHmac(rawBody, headerSig) {
  const secret = config.haravan.webhookSecret;
  if (!secret) return true;
  if (!headerSig || !rawBody?.length) return false;
  const calc = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(headerSig), Buffer.from(calc));
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('[webhook] read body failed:', err.message);
    return res.status(400).json({ error: 'invalid_body' });
  }

  const headerSig =
    req.headers['x-haravan-hmacsha256'] ||
    req.headers['x-haravan-hmac-sha256'];
  if (!verifyHmac(rawBody, headerSig)) {
    console.warn('[webhook] HMAC verification failed');
    return res.status(401).json({ error: 'invalid_signature' });
  }

  let order;
  try {
    order = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    console.error('[webhook] invalid JSON:', err.message);
    return res.status(200).json({ ok: true });
  }

  if (!order || !order.id) {
    console.warn('[webhook] payload thiếu id, bỏ qua');
    return res.status(200).json({ ok: true });
  }

  try {
    const text = formatters.formatOrderMessage(order);
    await telegram.sendOrderNotification(text);
    console.log(`[webhook] đã gửi thông báo đơn ${order.name || order.id}`);
  } catch (err) {
    console.error('[webhook] lỗi gửi telegram:', err.message);
  }

  return res.status(200).json({ ok: true });
};

module.exports.config = {
  api: { bodyParser: false }
};
