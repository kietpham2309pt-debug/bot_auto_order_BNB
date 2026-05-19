const express = require('express');
const config = require('./config');
const webhookRouter = require('./webhook');
const { startScheduler } = require('./scheduler');
const telegram = require('./telegram');

const app = express();

app.get('/', (_req, res) => res.send('BNB Haravan Telegram Bot is running.'));
app.use('/webhook', webhookRouter);

app.listen(config.server.port, async () => {
  console.log(`[server] listening on :${config.server.port} (tz=${config.server.timezone})`);
  try {
    const me = await telegram.getMe();
    console.log(`[telegram] bot connected as @${me.result?.username}`);
  } catch (e) {
    console.error('[telegram] getMe failed — kiểm tra TELEGRAM_BOT_TOKEN:', e.message);
  }
  startScheduler();
});

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));
