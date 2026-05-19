# SETUP — BNB Haravan Telegram Bot (Vercel)

Hướng dẫn từ A→Z. Anh chỉ cần làm theo 7 bước.

---

## 1. Tạo Telegram Bot

1. Mở Telegram, tìm **@BotFather** (có dấu tick xanh).
2. Gõ lệnh `/newbot`.
3. Nhập **Tên bot** (vd: `BNB Order Notify`).
4. Nhập **Username bot** (kết thúc bằng `bot`, vd: `bnb_order_notify_bot`).
5. BotFather sẽ trả về **HTTP API token** dạng `123456789:ABCDEF...` → lưu lại, sẽ điền vào `TELEGRAM_BOT_TOKEN`.

> Tip: gõ `/setprivacy` → chọn bot vừa tạo → `Disable` để bot đọc được tin nhắn trong group (cần khi muốn lấy chat_id bằng cách gõ trong group).

---

## 2. Lấy chat_id của nhóm/channel nhận thông báo

**Group thường:**
1. Tạo group Telegram (vd: `BNB - Đơn mới`).
2. Add bot vừa tạo vào group, đặt bot làm admin (chỉ cần quyền gửi tin).
3. Trong group, gõ bất kỳ tin nhắn nào.
4. Mở browser, truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Tìm `"chat":{"id":-1234567890,...}` → đó là `chat_id` → điền vào `TELEGRAM_CHAT_ID_ORDERS`.

> Có thể dùng chung 1 group cho cả order + KPI bằng cách điền cùng `chat_id` cho cả `TELEGRAM_CHAT_ID_ORDERS` và `TELEGRAM_CHAT_ID_KPI`.

---

## 3. Tạo `HARAVAN_API_TOKEN` mới

Vào **Haravan Admin → Cài đặt → Tài khoản & Quyền → Apps riêng tư** → tạo Private App mới → copy token.

Cần các quyền: `read_orders`, `read_products`, `read_customers`.

> ⚠️ Nếu token cũ đã từng share trong chat hoặc file công khai, BẮT BUỘC tạo token mới và xóa cái cũ.

---

## 4. Sinh `CRON_SECRET`

Đây là chuỗi ngẫu nhiên dùng để bảo vệ endpoint cron (tránh người ngoài trigger được KPI). Sinh bằng 1 trong 2 cách:

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

```bash
# Hoặc Linux/macOS
openssl rand -hex 32
```

Lưu lại chuỗi này — sẽ điền vào Vercel env và cron-job.org.

---

## 5. Deploy lên Vercel

1. Mở https://vercel.com/new
2. **Import Git Repository** → chọn repo `kietpham2309pt-debug/bot_auto_order_BNB`
   - Nếu repo không hiện, vào https://github.com/settings/installations → Vercel → Configure → cấp quyền cho repo này.
3. Trong tab **Environment Variables**, thêm các biến (lấy từ `.env.example`):

   | Tên | Giá trị |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | từ bước 1 |
   | `TELEGRAM_CHAT_ID_ORDERS` | từ bước 2 |
   | `TELEGRAM_CHAT_ID_KPI` | thường giống ORDERS |
   | `HARAVAN_SHOP_DOMAIN` | `bosch-home-online.myharavan.com` |
   | `HARAVAN_API_TOKEN` | từ bước 3 |
   | `SHOWROOM_NAME` | `Showroom Vincom Royal City` |
   | `KPI_MONTHLY_TARGET` | `2100000000` (vd 2.1 tỷ) |
   | `TIMEZONE` | `Asia/Ho_Chi_Minh` |
   | `HARAVAN_WEBHOOK_SECRET` | để trống lúc đầu, điền lại sau khi tạo webhook |
   | `CRON_SECRET` | từ bước 4 |

4. Bấm **Deploy** → đợi ~1 phút → có URL dạng `https://bot-auto-order-bnb.vercel.app`.

5. Test health check: mở `https://<vercel-url>/` ở browser → phải trả JSON `{ "ok": true, ... }`.

---

## 6. Đăng ký Webhook Haravan

1. Vào **Haravan Admin → Cài đặt → Thông báo** → cuộn xuống mục **Webhooks**.
2. Bấm **Tạo webhook**:
   - **Event**: `Order creation` (đơn hàng được tạo)
   - **Format**: `JSON`
   - **URL**: `https://<vercel-url>/webhook/haravan/orders`
3. (Khuyến nghị) Bấm **Tạo webhook và xem secret key** → copy secret → vào Vercel Dashboard → Settings → Environment Variables → cập nhật `HARAVAN_WEBHOOK_SECRET` → **Redeploy** (để env mới apply).
4. Bấm **Send test notification** trên Haravan → check Telegram phải nhận được tin.

> Có thể tạo thêm webhook event **Order payment** (đã thanh toán) nếu muốn 2 tin: lúc tạo và lúc thanh toán xong.

---

## 7. Setup cron miễn phí trên cron-job.org

1. Mở https://cron-job.org/en/signup/ → tạo tài khoản miễn phí (xác thực email).
2. Bấm **CREATE CRONJOB** → tạo 3 job:

   | Job | URL | Schedule (giờ VN) | Method |
   |---|---|---|---|
   | KPI Morning | `https://<vercel-url>/api/cron/morning?key=<CRON_SECRET>` | Daily 10:00 | GET |
   | KPI Midshift | `https://<vercel-url>/api/cron/midshift?key=<CRON_SECRET>` | Daily 14:00 | GET |
   | KPI Evening | `https://<vercel-url>/api/cron/evening?key=<CRON_SECRET>` | Daily 22:00 | GET |

3. Phần **Timezone** → chọn `Asia/Ho_Chi_Minh`.
4. **Save** → bấm **Execute now** để test ngay → check Telegram.

> Nếu cron-job.org log báo `401 unauthorized` → kiểm tra lại `CRON_SECRET` ở Vercel và URL có khớp không.

---

## 8. Troubleshooting

| Triệu chứng | Cách fix |
|---|---|
| Vercel build fail `Missing required env` | Chưa set env trên Vercel → vào Settings → Environment Variables, thêm đủ, Redeploy |
| Webhook test trả 401 `invalid_signature` | Sai `HARAVAN_WEBHOOK_SECRET` — tạm để trống biến này trên Vercel, redeploy, thử lại |
| Webhook trả 405 | Haravan gọi GET thay vì POST — set lại Event/Method trong Haravan |
| Cron trả 401 `unauthorized` | URL thiếu `?key=...` hoặc `CRON_SECRET` ở 2 nơi không khớp |
| `getMe failed` (test local) | Token sai hoặc bot bị xóa, lấy lại từ BotFather |
| KPI báo `achievedMTD: 0` | Token Haravan thiếu quyền `read_orders`, hoặc sai format domain |
| Tin nhắn Telegram lỗi 400 | Format HTML sai — check log ở Vercel Dashboard → Logs |

---

## 9. Tùy chỉnh

- **Đổi giờ gửi KPI**: sửa schedule trong cron-job.org (không cần redeploy code).
- **Đổi format tin nhắn**: sửa `src/formatters.js` → commit + push → Vercel auto deploy.
- **Đổi target KPI tháng**: vào Vercel → Settings → Env Vars → đổi `KPI_MONTHLY_TARGET` → Redeploy.
- **Thêm event webhook** (vd: đơn cancel): tạo file mới `api/webhook/haravan/cancel.js` tương tự `orders.js`.
