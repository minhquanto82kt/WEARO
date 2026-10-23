# Deployment Runbook — GitHub + Vercel

Tài liệu này mô tả luồng phát hành WEARO dựa trên cấu hình hiện có trong repository. Không thay thế cấu hình Project Settings trên Vercel; các giá trị trong Dashboard vẫn cần được đối chiếu với project thực tế.

## 1. Source of truth

- **GitHub**: source code và lịch sử thay đổi.
- **GitHub Actions**: kiểm tra build, typecheck, lint, architecture và smoke/invariant tests.
- **Vercel**: Preview Deployments cho thay đổi và Production Deployment theo cấu hình branch của project.
- **Supabase**: nguồn dữ liệu production; không dùng dữ liệu/credentials production trong CI.

## 2. Repository layout cần lưu ý

Ứng dụng nằm trong thư mục con `fashion-dream-try-on-main/`, không nằm ở root của repository.

Các file cấu hình đã có trên nhánh `feature/product-admin`:

- `fashion-dream-try-on-main/package.json` — scripts và yêu cầu Node.js `>=24 <25`.
- `fashion-dream-try-on-main/package-lock.json` — lockfile cho `npm ci`.
- `fashion-dream-try-on-main/vercel.json` — install command và cấu hình function cho `api/[...path].py`.
- `fashion-dream-try-on-main/.env.example` — danh sách biến môi trường mẫu; không phải file chứa giá trị secret.
- `.github/workflows/ci.yml` — workflow CI ở root repository, chạy lệnh trong `fashion-dream-try-on-main/`.

## 3. Kiểm tra Vercel Project Settings

Trong Vercel Dashboard, mở đúng project WEARO và kiểm tra:

1. **Git Repository** trỏ đến `minhquanto82kt/WEARO`.
2. **Root Directory** là `fashion-dream-try-on-main`. Nếu Root Directory được đặt ở repository root, các lệnh build có thể chạy sai thư mục.
3. **Production Branch** đúng với nhánh mà nhóm đã chọn để phát hành. Không mặc định `feature/product-admin` là production branch.
4. **Node.js Version** tương thích với Node 24 theo `package.json`.
5. **Install Command** tương thích với `npm ci --legacy-peer-deps --no-audit --no-fund`, như đã khai báo trong `vercel.json`.
6. **Build Command** dùng script `npm run build`, trừ khi project có override được chủ động cấu hình.
7. Kiểm tra Environment Variables theo từng môi trường **Development / Preview / Production**. Chỉ nhập secret trong Vercel Settings hoặc secret manager phù hợp; không commit giá trị thật vào GitHub.
8. Kiểm tra các biến server-side (Supabase, AI provider, payment, cron) có đúng scope môi trường. Không đưa secret vào biến có tiền tố `VITE_`.

Không thay đổi Root Directory, build settings hoặc Production Branch nếu chưa xác minh cấu hình hiện tại và mục tiêu phát hành.

## 4. Luồng thay đổi đề xuất

1. Tạo commit trên nhánh feature, ví dụ `feature/product-admin`.
2. Mở **Actions → CI** và xác nhận workflow của commit đã chạy.
3. Chờ các bước install, dependency audit, build, typecheck, lint, architecture audit và smoke/invariant tests hoàn tất.
4. Xem Preview Deployment do Vercel tạo cho commit/branch đó.
5. Kiểm tra các luồng quan trọng trên Preview: trang chủ, `/shop`, `/ai`, giỏ hàng, checkout và các luồng admin liên quan đến thay đổi.
6. Chỉ merge vào Production Branch sau khi CI và Preview được kiểm tra.
7. Mở Vercel **Deployments**, xác minh deployment tương ứng với đúng commit SHA và trạng thái **Ready**.
8. Kiểm tra production bằng trình duyệt; nếu lỗi, đối chiếu Build Logs, Runtime Logs, Environment Variables và Browser Console/Network trước khi sửa code tiếp.

CI xanh không tự chứng minh mọi tích hợp bên ngoài hoạt động; Preview Ready cũng không chứng minh các luồng thanh toán hoặc AI đã được xác minh end-to-end.

## 5. Xử lý lỗi nhanh

| Triệu chứng | Kiểm tra trước |
| --- | --- |
| Vercel không phát hiện commit | Git integration, repository được liên kết, branch và commit mới nhất |
| Build báo không tìm thấy `package.json` | Root Directory phải trỏ đến `fashion-dream-try-on-main` |
| Local chạy nhưng Preview/Production lỗi | Environment Variables theo đúng môi trường, Node.js version, build/runtime logs |
| CI thất bại | Mở job và bước thất bại trong GitHub Actions; sửa nguyên nhân trước khi deploy |
| Trang trả lỗi sau khi deployment Ready | Runtime Logs, API response, Supabase Auth/RLS và Browser Network |
| AI hoặc thanh toán không hoạt động | Server-side provider credentials, callback/IPN URL và log xác minh; không đánh dấu thanh toán thành công chỉ vì trang QR đã mở |

## 6. Kiểm tra trước khi phát hành

Tại thư mục ứng dụng, chạy các bước kiểm tra không cần server đang chạy:

```bash
npm ci --legacy-peer-deps --no-audit --no-fund
npm run audit:dependencies
npm run build
npm run typecheck
npm run lint
npm run audit:architecture
```

Để chạy route smoke test, mở một terminal chạy `npm run dev -- --host 127.0.0.1 --port 8080`; ở terminal khác đặt `BASE_URL=http://127.0.0.1:8080` rồi chạy `npm run test:smoke`. Trên Windows PowerShell, dùng `$env:BASE_URL="http://127.0.0.1:8080"; npm run test:smoke`.

Workflow CI chạy thêm các bài test invariant, commerce flow, customer experience, security và provider integration. Xem `.github/workflows/ci.yml` để biết danh sách hiện hành.

## 7. Quy tắc an toàn

- Không commit `.env` hoặc token/secret thật.
- Không tắt Supabase RLS để làm cho deployment chạy được.
- Không sửa/xóa dữ liệu production trong quá trình kiểm tra deployment.
- Không coi một commit GitHub hoặc trạng thái **Ready** là bằng chứng đủ cho tính năng end-to-end.
- Khi rollback, chọn deployment đã xác minh trước đó trong Vercel; đồng thời tạo commit sửa nguyên nhân để source code và production không lệch nhau lâu dài.
