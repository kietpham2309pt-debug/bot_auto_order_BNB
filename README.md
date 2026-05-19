# BNB Haravan Telegram Bot

Bot Telegram cho BNB:
- Nhận webhook đơn mới từ Haravan và gửi tin nhắn vào nhóm Telegram
- Gửi báo cáo KPI tự động vào 10h sáng, 14h (giữa ca), 22h tối hằng ngày

## Quick start

```bash
npm install
cp .env.example .env
# Sửa .env với token thật
npm start
```

Xem hướng dẫn chi tiết tại [`docs/SETUP.md`](docs/SETUP.md):
1. Tạo Telegram bot và lấy chat_id
2. Đăng ký webhook trên Haravan
3. Chạy local (test với ngrok)
4. Deploy lên VPS với PM2 + Nginx

## Cấu trúc

```
src/
├── index.js        # entry point: express + scheduler
├── config.js       # load .env + validate
├── telegram.js     # gửi tin qua Bot API
├── haravan.js      # gọi Haravan REST API
├── formatters.js   # format tin đơn mới + KPI
├── kpi.js          # tính doanh thu MTD, % hoàn thành...
├── webhook.js      # POST /webhook/haravan/orders
└── scheduler.js    # cron 10h/14h/22h

docs/SETUP.md       # hướng dẫn từ A-Z
```
