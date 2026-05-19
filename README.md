# BNB Haravan Telegram Bot (Vercel)

Bot Telegram cho BNB, deploy serverless trên Vercel:
- Nhận webhook đơn mới từ Haravan → gửi tin vào nhóm Telegram
- Cron 10h / 14h / 22h (giờ VN) gửi báo cáo KPI tháng — trigger bởi cron-job.org

## Quick deploy

1. **Push code lên GitHub** (đã xong).
2. Vào https://vercel.com/new → Import repo `bot_auto_order_BNB`.
3. Trong tab **Environment Variables**, paste hết các biến từ `.env.example` (giá trị thực, sinh `CRON_SECRET` ngẫu nhiên).
4. Bấm **Deploy** → có URL `https://<project>.vercel.app`.
5. **Đăng webhook Haravan** với URL:
   ```
   https://<project>.vercel.app/webhook/haravan/orders
   ```
6. **Setup cron** trên https://cron-job.org (miễn phí, không cần tài khoản trả phí):
   - Job 1: GET `https://<project>.vercel.app/api/cron/morning?key=<CRON_SECRET>` — schedule `0 10 * * *` (10h VN, hoặc `0 3 * * *` UTC)
   - Job 2: GET `https://<project>.vercel.app/api/cron/midshift?key=<CRON_SECRET>` — schedule `0 14 * * *` (14h VN)
   - Job 3: GET `https://<project>.vercel.app/api/cron/evening?key=<CRON_SECRET>` — schedule `0 22 * * *` (22h VN)

Xem hướng dẫn chi tiết tại [`docs/SETUP.md`](docs/SETUP.md).

## Test local

```powershell
npm install
cp .env.example .env
# Sửa .env với token thật
node scripts/test-order.js     # gửi tin đơn hàng giả lên Telegram
node scripts/test-kpi.js       # pull số liệu thật từ Haravan và gửi 3 tin KPI
```

Chạy thử Vercel local:
```powershell
npm install -g vercel
vercel dev
```

## Cấu trúc

```
api/
├── index.js                       # GET / — health check
├── webhook/haravan/orders.js      # POST /webhook/haravan/orders
└── cron/
    ├── morning.js                 # GET /api/cron/morning
    ├── midshift.js                # GET /api/cron/midshift
    └── evening.js                 # GET /api/cron/evening

src/
├── config.js                      # load env + validate
├── telegram.js                    # gọi Telegram Bot API
├── haravan.js                     # gọi Haravan REST API
├── formatters.js                  # format tin đơn mới + KPI
├── kpi.js                         # tính doanh thu MTD, % hoàn thành...
└── cron-handler.js                # shared logic cho 3 cron endpoint

vercel.json                        # rewrites /webhook/* → /api/webhook/*
```
