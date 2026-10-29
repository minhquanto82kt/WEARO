# Runbook — kiểm thử tính năng màu sắc

## Trạng thái

- Database: đã thêm `products.color_options` và `product_variants.color_hex` vào Supabase project `oazipcrbutizdncctkcg`.
- RLS: trước migration, RLS đã bật trên cả hai bảng; migration không thay đổi policy.
- Ứng dụng: chưa đánh dấu hoàn thành cho đến khi admin edit, product detail, variant selection và checkout được kiểm thử.
- Deployment: xác nhận deployment khớp commit của nhánh `feature/product-admin`; trạng thái READY đơn lẻ không chứng minh tính năng đúng.

## SQL xác minh schema

    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and (table_name, column_name) in (
        ('products', 'color_options'),
        ('product_variants', 'color_hex')
      )
    order by table_name, column_name;

    select tablename, rowsecurity
    from pg_tables
    where schemaname = 'public'
      and tablename in ('products', 'product_variants');

## Kiểm thử nghiệp vụ bắt buộc

1. Tạo sản phẩm một màu, lưu tên màu + HEX; tải lại trang và xác nhận dữ liệu còn.
2. Tạo sản phẩm phối 2–3 màu; xác nhận mỗi màu hiển thị đúng.
3. Tạo hai biến thể cùng size nhưng khác màu, mỗi biến thể có SKU/stock riêng.
4. Chọn màu A + size M; xác nhận giỏ hàng dùng đúng variant ID của A/M.
5. Trên môi trường test, đặt stock biến thể về 0; xác nhận UI không cho mua.
6. Sửa màu tổng quan không làm thay đổi SKU/tồn kho ngoài ý muốn.
7. Xác nhận người chưa đăng nhập không thể sửa sản phẩm; admin được phép theo policy hiện có.
8. Xác nhận đơn hàng cũ vẫn hiển thị thông tin variant đã mua.

## Build và deploy

Tại thư mục `fashion-dream-try-on-main` chạy:

    npm ci
    npm run typecheck
    npm run lint
    npm run build
    npm run test:smoke
    npm run test:customer-flows

Sau đó kiểm tra Vercel deployment gắn đúng repository, branch và commit. Thử Preview trước Production.
