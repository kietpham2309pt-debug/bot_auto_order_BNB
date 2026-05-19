const https = require('https');
const data = JSON.stringify({
  chat_id: '-1003820705687',
  text: '✅ Bot kết nối thành công vào group. Đang setup webhook & KPI...',
  parse_mode: 'HTML'
});
const req = https.request({
  hostname: 'api.telegram.org',
  path: '/bot8889748229:AAEjqOLDO-ODjHpgKQIIaqWYBCpVfFCQyz8/sendMessage',
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => console.log(body));
});
req.on('error', (e) => console.error(e));
req.write(data);
req.end();
