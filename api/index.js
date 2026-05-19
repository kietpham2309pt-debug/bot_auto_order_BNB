module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'BNB Haravan Telegram Bot',
    time: new Date().toISOString(),
    endpoints: {
      webhook: '/webhook/haravan/orders',
      cron: ['/api/cron/morning', '/api/cron/midshift', '/api/cron/evening']
    }
  });
};
