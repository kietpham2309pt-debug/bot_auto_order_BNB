const axios = require('axios');
const config = require('./config');

const client = axios.create({
  baseURL: `https://${config.haravan.domain}`,
  headers: {
    Authorization: `Bearer ${config.haravan.token}`,
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

async function getOrder(orderId) {
  const { data } = await client.get(`/admin/orders/${orderId}.json`);
  return data.order;
}

async function listOrders(params = {}) {
  const { data } = await client.get('/admin/orders.json', { params });
  return data.orders || [];
}

async function sumRevenueBetween(startISO, endISO, { financialStatus = 'paid,partially_paid' } = {}) {
  let total = 0;
  let page = 1;
  const limit = 250;
  while (true) {
    const orders = await listOrders({
      created_at_min: startISO,
      created_at_max: endISO,
      status: 'any',
      financial_status: financialStatus,
      limit,
      page
    });
    if (!orders.length) break;
    for (const o of orders) {
      if (o.cancelled_at) continue;
      const amount = parseFloat(o.total_price || 0);
      total += isNaN(amount) ? 0 : amount;
    }
    if (orders.length < limit) break;
    page += 1;
    if (page > 50) break;
  }
  return total;
}

module.exports = { client, getOrder, listOrders, sumRevenueBetween };
