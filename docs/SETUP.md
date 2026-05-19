# SETUP — BNB Haravan Telegram Bot

Hướng dẫn từ A→Z. Anh chỉ cần làm theo 6 bước.

---

## 1. Tạo Telegram Bot

1. Mở Telegram, tìm **@BotFather** (có dấu tick xanh).
2. Gõ lệnh `/newbot`.
3. Nhập **Tên bot** (vd: `BNB Order Notify`).
4. Nhập **Username bot** (kết thúc bằng `bot`, vd: `bnb_order_notify_bot`).
5. BotFather sẽ trả về **HTTP API token** dạng `123456789:ABCDEF...` → lưu lại, sẽ điền vào `TELEGRAM_BOT_TOKEN` trong `.env`.

> Tip: cũng nên gõ `/setprivacy` → chọn bot vừa tạo → chọn `Disable` để bot đọc được tin nhắn trong group (cần khi muốn lấy chat_id bằng cách gõ trong group).

---

## 2. Lấy chat_id của nhóm/channel nhận thông báo

**Cách 1: Group thường**
1. Tạo group Telegram (vd: `BNB - Đơn mới`).
2. Add bot vừa tạo vào group, **đặt bot làm admin** (chỉ cần quyền gửi tin).
3. Trong group, gõ bất kỳ tin nhắn nào (vd: `/start`).
4. Mở browser, truy cập:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
   Thay `<TOKEN>` bằng token bot (không có chữ `bot` ở đầu).
5. Tìm `"chat":{"id":-1234567890,...}` → đó là `chat_id` → điền vào `TELEGRAM_CHAT_ID_ORDERS`.

**Cách 2: Channel**
1. Tạo channel, add bot làm admin.
2. Post 1 tin trong channel.
3. Forward tin đó vào @JsonDumpBot hoặc gọi `getUpdates` → lấy id (dạng `-100xxxxxxxx`).

**Cách 3: Chat riêng**
1. Bắt chuyện với bot (search username bot → `/start`).
2. Mở `getUpdates` → lấy `chat.id` (số dương).

> Có thể dùng chung 1 group cho cả order + KPI bằng cách điền cùng 1 `chat_id` cho cả `TELEGRAM_CHAT_ID_ORDERS` và `TELEGRAM_CHAT_ID_KPI`.

---

## 3. Cấu hình `.env`

```bash
cd D:\tool
copy .env.example .env
```

Mở `.env`, điền:
- `TELEGRAM_BOT_TOKEN` — từ bước 1
- `TELEGRAM_CHAT_ID_ORDERS` và `TELEGRAM_CHAT_ID_KPI` — từ bước 2
- `HARAVAN_API_TOKEN` — token Haravan
- `KPI_MONTHLY_TARGET` — target tháng (vd `2100000000` cho 2.1 tỷ)
- `SHOWROOM_NAME` — tên hiển thị

> **QUAN TRỌNG về bảo mật:** vì token Haravan đã share trong chat trước đó, vào Haravan Admin → **Cài đặt → Tài khoản & Quyền → Apps riêng tư** → tạo Private App mới → copy token mới và xóa token cũ. Cần các quyền sau: `read_orders`, `read_products`, `read_customers`.

---

## 4. Chạy local để test

Cài Node.js >= 18 (https://nodejs.org/) rồi:

```powershell
cd D:\tool
npm install
npm start
```

Nếu OK, console sẽ log:
```
[server] listening on :3001 (tz=Asia/Ho_Chi_Minh)
[telegram] bot connected as @bnb_order_notify_bot
[cron] scheduled morning="0 10 * * *" ...
```

**Test tin nhắn đơn (không cần đơn thật):**
```powershell
node scripts/test-order.js
```
→ check Telegram, phải nhận được tin định dạng giống ảnh anh gửi.

**Test tin nhắn KPI (sẽ pull số liệu thật từ Haravan):**
```powershell
node scripts/test-kpi.js morning
node scripts/test-kpi.js midshift
node scripts/test-kpi.js evening
```

---

## 5. Đăng ký Webhook Haravan

### 5.1. Expose endpoint ra Internet (khi test local)

Cài **Cloudflare Tunnel** (miễn phí, không cần đăng ký domain để test):
```powershell
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:3001
```

→ Hiển thị URL public dạng `https://abc-xyz.trycloudflare.com`. Copy URL này.

Hoặc dùng **ngrok**: `ngrok http 3001` → lấy URL `https://xxx.ngrok-free.app`.

### 5.2. Đăng ký webhook trên Haravan

1. Vào Haravan Admin → **Cài đặt** (Settings) → **Thông báo** (Notifications) → cuộn xuống mục **Webhooks**.
2. Bấm **Tạo webhook**.
3. Cấu hình:
   - **Event**: `Order creation` (đơn hàng được tạo)
   - **Format**: `JSON`
   - **URL**: `https://<public-url>/webhook/haravan/orders`
     - VD local test: `https://abc-xyz.trycloudflare.com/webhook/haravan/orders`
     - VD production: `https://bot.bnb-domain.com/webhook/haravan/orders`
4. (Khuyến nghị) Bấm **Tạo webhook và xem secret key** → copy secret → dán vào `HARAVAN_WEBHOOK_SECRET` trong `.env`.
5. Bấm **Send test notification** trên Haravan → check Telegram.

> Có thể tạo thêm webhook cho event **Order payment** (đã thanh toán) nếu muốn nhận 2 tin: lúc tạo và lúc thanh toán xong.

---

## 6. Deploy lên VPS (production)

### Phương án A: VPS Linux + PM2 + Nginx (đề xuất)

VPS đang chạy web khác không sao — bot dùng port riêng, không đụng nhau.

**Trên VPS:**

```bash
# 1. Cài Node 18+ nếu chưa có
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Cài PM2 (process manager, tự restart nếu bot chết)
sudo npm install -g pm2

# 3. Clone code
cd /opt
sudo git clone https://github.com/<your-user>/bnb-haravan-telegram-bot.git bnb-bot
sudo chown -R $USER:$USER bnb-bot
cd bnb-bot

# 4. Cài deps + tạo .env
npm install --production
cp .env.example .env
nano .env   # điền hết các token

# 5. Start với PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup     # follow command nó in ra để tự start khi VPS reboot
pm2 logs bnb-bot
```

**Cấu hình Nginx reverse proxy** (giả sử anh có subdomain `bot.example.com` trỏ về IP VPS):

```bash
sudo nano /etc/nginx/sites-available/bnb-bot
```

Dán nội dung:
```nginx
server {
    listen 80;
    server_name bot.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bnb-bot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Cấp SSL miễn phí
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d bot.example.com
```

Sau đó URL webhook đăng ký bên Haravan đổi thành:
`https://bot.example.com/webhook/haravan/orders`

**Lệnh PM2 hữu ích:**
- `pm2 status` — xem bot còn sống
- `pm2 logs bnb-bot` — xem log realtime
- `pm2 restart bnb-bot` — restart sau khi sửa code
- `pm2 monit` — dashboard CPU/RAM

### Phương án B: Railway / Render (no-VPS, free tier)

1. Push code lên GitHub (xem section dưới).
2. Vào https://railway.app → **New Project → Deploy from GitHub** → chọn repo.
3. Vào tab **Variables** → paste hết nội dung `.env`.
4. Vào tab **Settings → Networking → Generate Domain** → lấy URL dạng `https://bnb-bot.up.railway.app`.
5. Đăng ký webhook Haravan với URL đó.

---

## 7. Push code lên GitHub

```powershell
cd D:\tool
git init
git add .
git commit -m "Initial commit: BNB Haravan Telegram bot"
# Tạo repo private trên GitHub trước (vd: bnb-haravan-telegram-bot)
git remote add origin https://github.com/<your-user>/bnb-haravan-telegram-bot.git
git branch -M main
git push -u origin main
```

> `.env` đã có trong `.gitignore` nên token KHÔNG bị push lên — yên tâm.
> Tạo repo **private**, không public.

---

## 8. Troubleshooting

| Triệu chứng | Cách fix |
|---|---|
| `Missing required env: TELEGRAM_BOT_TOKEN` | Chưa tạo `.env` hoặc thiếu biến |
| `getMe failed` | Token sai hoặc bot bị xóa |
| `[webhook] HMAC verification failed` | Sai `HARAVAN_WEBHOOK_SECRET`, hoặc tạm thời để trống để bỏ verify |
| Webhook Haravan báo timeout | Public URL chưa expose hoặc server không chạy |
| KPI báo `achievedMTD: 0` | Token Haravan chưa có quyền `read_orders`, hoặc format domain sai |
| Tin nhắn Telegram lỗi 400 | Format HTML sai — check console log |
| Cron không chạy | VPS sai timezone, set `TIMEZONE=Asia/Ho_Chi_Minh` trong `.env` |

---

## 9. Tùy chỉnh

- **Đổi giờ gửi KPI**: sửa `CRON_KPI_MORNING`, `CRON_KPI_MIDSHIFT`, `CRON_KPI_EVENING` trong `.env` (cú pháp cron: phút giờ ngày tháng thứ).
- **Đổi format tin nhắn**: sửa `src/formatters.js`.
- **Target KPI tháng**: đổi `KPI_MONTHLY_TARGET` đầu mỗi tháng.
- **Thêm event webhook** (vd: đơn cancel): tạo route mới trong `src/webhook.js`.
