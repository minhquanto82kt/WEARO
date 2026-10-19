# WEARO — Collection Color Palettes

Tài liệu theo dõi bảng màu của 4 collection. Mỗi collection có một thư mục riêng và README.md để dễ cập nhật.

## Danh sách collection

| Collection | Màu chính (Primary) | Màu phụ (Secondary) | Màu nhấn (Accent) | Nền trang (Paper) |
|---|---|---|---|---|
| [Casual](./casual/README.md) | `#54728C` | `#7794A6` | `#F2CEAE` | `#F8F6F2` |
| [Basic](./basic/README.md) | `#252525` | `#777771` | `#D8D5CE` | `#F5F3EF` |
| [Streetwear](./streetwear/README.md) | `#26352D` | `#171A18` | `#D7F27C` | `#F3F4EE` |
| [Outing Style](./outing-style/README.md) | `#355C4A` | `#8EAD91` | `#E7B879` | `#F2F4ED` |

## Ý nghĩa các biến

- **Primary:** màu chủ đạo cho tiêu đề, nút hoặc thành phần nổi bật.
- **Secondary:** màu phụ để tạo tương phản và phân cấp.
- **Accent:** màu nhấn cho chi tiết cần thu hút chú ý.
- **Paper:** màu nền tổng thể của trang collection.
- **Ink:** màu chữ mặc định, hiện là `#171717`.

## Nguồn màu trong code

Các giá trị trên được đối chiếu từ [`wearo-collection-pages.scss`](../../fashion-dream-try-on-main/src/styles/wearo-collection-pages.scss), nhánh `feature/product-admin`.

**Lưu ý:** Đây là palette của các **trang collection**, không khẳng định là màu nền chính xác của 4 thẻ trên trang chủ trong mục “WEARO / FIND YOUR STYLE”. Cần kiểm tra CSS riêng của section trang chủ trước khi ghi nhận màu của các thẻ đó.

## Quy tắc cập nhật

1. Khi thay đổi CSS palette, cập nhật README của collection tương ứng và bảng tổng hợp này.
2. Giữ mã HEX đồng nhất với CSS; không dùng màu ước lượng từ ảnh khi đã có mã trong source.
3. Ghi rõ phạm vi sử dụng màu (trang collection hay thẻ trang chủ) để tránh nhầm lẫn.
