# WEARO — quản lý màu sắc sản phẩm

## Mục tiêu

WEARO hỗ trợ đồng thời hai lớp màu:

1. **Màu tổng quan** (`products.color_options`): dùng để mô tả sản phẩm trên catalog/trang chi tiết. Mỗi phần tử là object gồm `name` và `hex`. Màu phối có thể có 2–3 phần tử.
2. **Màu biến thể** (`product_variants.color`, `product_variants.color_hex`): màu cụ thể gắn với SKU, size và tồn kho. Đây mới là dữ liệu cần dùng khi khách chọn hàng để mua.

Ví dụ màu tổng quan:

    { "mode": "multi", "colors": [

    [
      { "name": "Đen", "hex": "#111111" },
      { "name": "Trắng", "hex": "#F5F5F5" },
      { "name": "Đỏ", "hex": "#B91C1C" }
    ] }

## Quy tắc dữ liệu

- HEX theo định dạng `#RRGGBB`; database kiểm tra định dạng `color_hex` của biến thể.
- `color_options` theo cấu trúc `{mode, colors}`; giá trị mặc định `[]` vẫn được chấp nhận cho sản phẩm cũ.
- Không suy ra biến thể bán được chỉ từ `color_options`.
- Giỏ hàng và đơn hàng phải tham chiếu `product_variants.id`, không chỉ lưu màu hiển thị.
- Khi đổi màu/size, UI cần tải đúng biến thể và kiểm tra stock trước khi thêm giỏ.
- Không xóa hoặc thay ID biến thể đang được tham chiếu bởi cart/order history.
- RLS vẫn bật trên `products` và `product_variants`; không tắt RLS để sửa lỗi quyền.

## Migration

File: `supabase/migrations/202610290002_add_product_color_options_and_variant_hex.sql`.
Migration đã được áp dụng vào Supabase project **UpThink's WEARO** (ref `oazipcrbutizdncctkcg`). Cần xác minh schema và chạy build/tests trước khi dùng ở production.

## Checklist UI

- [ ] Form tạo sản phẩm: thêm/sửa màu tổng quan và xem trước swatch.
- [ ] Form chỉnh sửa sản phẩm: hydrate `color_options`; lưu update theo product ID.
- [ ] Quản lý biến thể: lưu `color_hex` cùng `color`, size, SKU, stock.
- [ ] Trang sản phẩm công khai: hiển thị màu tổng quan, không tạo giả lựa chọn mua.
- [ ] Chọn màu/size: resolve đúng `product_variants.id`; vô hiệu hóa lựa chọn hết hàng.
- [ ] Giỏ hàng/checkout: giữ variant ID xuyên suốt; xác nhận tồn kho ở server.
- [ ] Kiểm tra RLS, loading/empty/error state.
- [ ] Chạy typecheck, lint, build và smoke tests liên quan.
