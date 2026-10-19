# WEARO — Fashion Commerce & AI Virtual Try-On

**WEARO** là dự án thương mại điện tử thời trang unisex, định hướng kết hợp khám phá sản phẩm, hỗ trợ phối đồ bằng AI và trải nghiệm Virtual Try-On. Đây là dự án đang phát triển; các tính năng cần được xác minh qua CI và môi trường triển khai trước khi xem là hoàn tất.

[![CI](https://github.com/minhquanto82kt/fashion-dream-try-on-shop/actions/workflows/ci.yml/badge.svg?branch=feature%2Fproduct-admin)](https://github.com/minhquanto82kt/fashion-dream-try-on-shop/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/minhquanto82kt/fashion-dream-try-on-shop/feature%2Fproduct-admin)](https://github.com/minhquanto82kt/fashion-dream-try-on-shop/commits/feature/product-admin)
[![License](https://img.shields.io/badge/license-check%20repository-lightgrey)](https://github.com/minhquanto82kt/fashion-dream-try-on-shop)

## Truy cập bản triển khai

- **Store preview:** [Mở website](https://fashion-dream-try-on-main-git-main-up-think.vercel.app/)
- **Admin preview:** [Mở trang quản trị](https://fashion-dream-try-on-main-git-feature-product-admin-up-think.vercel.app/admin)

> Đây là các liên kết preview được lưu trong README trước đó; hãy xác minh lại trên Vercel nếu chúng không còn truy cập được.

## Kiến trúc tổng quan

```text
GitHub (source code)
       │
       ▼
GitHub Actions (build, typecheck, lint, smoke tests)
       │
       ▼
Vercel (deployment/runtime)
       │
       ▼
WEARO storefront ─── Supabase (database, auth, RLS)
       │
       ├── AI provider / Virtual Try-On
       └── Payment integrations
```

Supabase là nguồn dữ liệu chính của ứng dụng; GitHub quản lý mã nguồn. Cấu hình nhạy cảm phải được giữ ở server hoặc environment variables, không đưa vào client.

## Công nghệ

- React 19, TypeScript
- TanStack Start / Router, Vite
- Supabase Auth, PostgreSQL và Row Level Security (RLS)
- AI SDK và các tích hợp AI phía server
- Vercel
- Node.js 24, npm 11

## Thống kê tự động

Bảng dưới được sinh từ GitHub Repository API, trạng thái GitHub Actions và metadata trong `fashion-dream-try-on-main/package.json`. Workflow cập nhật khi có thay đổi mã nguồn và định kỳ mỗi 6 giờ; số liệu phụ thuộc quyền truy cập API và lịch sử workflow thực tế.

<!-- AUTO-REPO-STATS:START -->
<!-- Tự động cập nhật bởi .github/workflows/readme-stats.yml. -->
| Nguồn | Chỉ số | Giá trị hiện tại |
|---|---|---|
| Repository | Stars | 1 |
| Repository | Forks | 0 |
| Repository | Issues/PR đang mở | 5 |
| Repository | Dung lượng GitHub ước tính | 50.5 MB |
| Repository | Nhánh mặc định | `main` |
| Repository | Nhánh đang thống kê | `feature/product-admin` |
| Repository | Cập nhật gần nhất | 2026-10-19 06:09 UTC |
| GitHub Actions | CI gần nhất trên nhánh này | [In Progress](https://github.com/minhquanto82kt/fashion-dream-try-on-shop/actions/runs/39208324810) |
| Dữ liệu dự án | Package | `tanstack_start_ts` |
| Dữ liệu dự án | Runtime | Node.js `>=24 <25` · `npm@11` |
| Dữ liệu dự án | Ngôn ngữ GitHub nhận diện | CSS, JavaScript, Python, TypeScript |
| Dữ liệu dự án | Dependencies / devDependencies | 54 / 18 |
| Dữ liệu dự án | Script kiểm tra được khai báo | `lint`, `typecheck`, `build`, `test:smoke`, `test:customer-experience`, `audit:architecture`, `audit:dependencies` |

_Cập nhật tự động: 2026-10-19 06:10 UTC · nhánh `feature/product-admin`._
<!-- AUTO-REPO-STATS:END -->

## Phát triển local

Ứng dụng nằm trong thư mục `fashion-dream-try-on-main/`.

```bash
cd fashion-dream-try-on-main
npm ci --legacy-peer-deps
npm run dev
```

Các lệnh kiểm tra được khai báo trong `package.json`:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:smoke
npm run test:customer-experience
npm run audit:architecture
npm run audit:dependencies
```

## Tài liệu dự án

- [README ứng dụng và kiến trúc thương hiệu](fashion-dream-try-on-main/README.md)
- [Architecture](fashion-dream-try-on-main/docs/ARCHITECTURE.md)
- [Development workflow](fashion-dream-try-on-main/docs/DEVELOPMENT.md)
- [Brand system](fashion-dream-try-on-main/docs/BRAND-SYSTEM.md)
- [Admin authentication & RLS runbook](fashion-dream-try-on-main/docs/ADMIN-AUTH-RUNBOOK.md)
- [Deployment runbook](fashion-dream-try-on-main/docs/DEPLOYMENT-RUNBOOK.md)

## Nguyên tắc phát triển

- Giữ thay đổi nhỏ, bám theo kiến trúc hiện có.
- Xác định rõ CRUD, quyền truy cập và RLS cho tính năng dữ liệu.
- Không expose Supabase service-role key hoặc API secret ở phía client.
- Không coi commit hay build thành công là bằng chứng đủ để xác nhận tính năng production.
- WEARO là thương hiệu hướng tới khách hàng; UpThink là lớp quản trị nội bộ trong kiến trúc ứng dụng.
