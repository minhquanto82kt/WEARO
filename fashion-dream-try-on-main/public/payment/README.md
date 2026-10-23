# WEARO — Hệ thống nhận diện thanh toán

Tài liệu này mô tả các tài nguyên nhận diện thanh toán đang được lưu trong thư mục `public/payment/` của website WEARO và cách sử dụng chúng ở giao diện. **Logo là tài nguyên hiển thị; sự hiện diện của logo không tự chứng minh phương thức thanh toán đã được cấu hình hoặc đang xử lý giao dịch thật.**

## 1. Tài nguyên hiện có

| File | Nhận diện | Vai trò dự kiến |
|---|---|---|
| `VietQR_Logo.svg` | VietQR | Nhãn nhận diện cho thanh toán/chuyển khoản bằng mã QR |
| `MoMo_Logo_App.svg` | MoMo | Nhãn nhận diện ví điện tử MoMo |
| `visa.svg` | Visa | Nhận diện mạng lưới thẻ Visa |
| `mastercard.svg` | Mastercard | Nhận diện mạng lưới thẻ Mastercard |

Các file trên là SVG để giao diện có thể hiển thị ở nhiều kích thước mà không bị vỡ hình. Không sửa tên file hoặc đường dẫn mà chưa tìm các nơi đang tham chiếu chúng.

## 2. Cách tham chiếu trong frontend

Vì thư mục nằm trong `public/`, URL công khai bắt đầu bằng `/payment/` — không thêm tiền tố `/public`.

Ví dụ:

```tsx
<img src="/payment/VietQR_Logo.svg" alt="VietQR" />
<img src="/payment/MoMo_Logo_App.svg" alt="MoMo" />
<img src="/payment/visa.svg" alt="Visa" />
<img src="/payment/mastercard.svg" alt="Mastercard" />
```

Khuyến nghị:
- Luôn dùng `alt` mô tả thương hiệu; nếu logo chỉ trang trí và tên phương thức đã được đọc ngay cạnh, có thể dùng `alt=""` để tránh đọc lặp.
- Giữ tỷ lệ SVG bằng `width`/chiều cao phù hợp và `object-fit: contain`.
- Dùng nền trung tính và khoảng cách đồng nhất giữa các logo; không kéo giãn logo hoặc tự đổi màu logo thương hiệu.
- Đảm bảo giao diện vẫn hiển thị tên phương thức bằng chữ, không phụ thuộc duy nhất vào hình logo.

## 3. Luồng thanh toán liên quan trong codebase

Các điểm triển khai đã được đối chiếu trên nhánh `feature/product-admin`:

- Trang checkout: `src/routes/checkout.tsx`.
- Tạo URL QR VietQR: `src/lib/payments/vietqr.ts`; entry point tương thích `src/lib/vietqr.ts`.
- Tạo yêu cầu thanh toán MoMo phía server: `src/lib/momo.server.ts`.
- Trang nhận chuyển hướng MoMo: `src/routes/checkout/momo.tsx`.
- Callback/IPN MoMo: `src/routes/api/momo/ipn.ts`.
- Webhook SePay: `src/routes/api/sepay/webhook.ts`.
- Supabase Edge Function cho webhook SePay: `supabase/functions/payment-webhook/`.
- Schema tham chiếu thanh toán: `supabase/schema/004_payments.sql`.

Luồng nghiệp vụ cần giữ nguyên tắc: **tạo đơn → tạo trạng thái thanh toán chờ xử lý → xác minh giao dịch từ callback/webhook đáng tin cậy → cập nhật trạng thái thanh toán và đơn hàng**. Không đánh dấu đơn đã thanh toán chỉ vì khách hàng đã mở trang QR hoặc được chuyển hướng về website.

### Lưu ý cần xác minh

1. `src/lib/payments/vietqr.ts` hiện chứa cấu hình `bankId`, `accountNo`, `accountName` và mẫu QR. Hãy xác minh các giá trị này với tài khoản nhận tiền chính thức trước khi sử dụng trong production; không xem giá trị trong source là bằng chứng tài khoản đã được xác nhận.
2. `supabase/schema/004_payments.sql` hiện liệt kê các giá trị `method` là `cod`, `vietqr`, `momo`; trong khi checkout có lựa chọn `mastercard` và có route `/checkout/mastercard`. Cần kiểm tra schema/migration đang chạy và luồng xử lý thẻ trước khi kết luận Mastercard đã được hỗ trợ end-to-end. Không tự ý thay đổi schema production chỉ để khớp giao diện.
3. Các bí mật như `MOMO_SECRET_KEY`, `SUPABASE_SECRET_KEY` và `SEPAY_WEBHOOK_SECRET` chỉ được lưu trong biến môi trường phía server/Supabase, không đưa vào frontend hoặc README.
4. Khi kiểm tra lỗi thanh toán, đối chiếu theo thứ tự: checkout UI → request/API → callback hoặc webhook → Supabase RPC/database → trạng thái đơn hàng → giao diện xác nhận.

## 4. Checklist khi thêm hoặc thay logo

- [ ] File SVG có nguồn hợp lệ và đúng thương hiệu.
- [ ] Đường dẫn dùng trong frontend bắt đầu bằng `/payment/`.
- [ ] Logo hiển thị tốt trên desktop và mobile, không bị méo hoặc cắt.
- [ ] Có tên phương thức thanh toán bằng văn bản và trạng thái chọn rõ ràng.
- [ ] Thử nghiệm luồng giao dịch sandbox/test trước khi dùng production.
- [ ] Xác nhận webhook/callback và trạng thái đơn hàng từ dữ liệu thực; không chỉ kiểm tra giao diện.
- [ ] Không ghi secret, token, thông tin tài khoản nhạy cảm hoặc dữ liệu khách hàng vào tài liệu.

## 5. Phạm vi tài liệu

README này là tài liệu định danh tài nguyên giao diện và chỉ dẫn đến các file triển khai liên quan. Nó **không** xác nhận tài khoản ngân hàng, merchant MoMo, cấu hình SePay, môi trường production hay giao dịch thẻ đã được nghiệm thu. Hãy cập nhật tài liệu sau khi cấu hình hoặc luồng thanh toán thực tế thay đổi.
