# WEARO — Collection Color Palettes

Tài liệu theo dõi bảng màu của 4 collection. Các preview màu được hiển thị bằng badge để xem nhanh ngay trên GitHub.

## Danh sách collection

| Collection | Màu chính (Primary) | Màu phụ (Secondary) | Màu nhấn (Accent) | Nền trang (Paper) |
|---|---|---|---|---|
| [Casual](./casual/README.md) | ![#54728C](https://img.shields.io/badge/-%2354728C-54728C?style=flat-square) `#54728C` | ![#7794A6](https://img.shields.io/badge/-%237794A6-7794A6?style=flat-square) `#7794A6` | ![#F2CEAE](https://img.shields.io/badge/-%23F2CEAE-F2CEAE?style=flat-square) `#F2CEAE` | ![#F8F6F2](https://img.shields.io/badge/-%23F8F6F2-F8F6F2?style=flat-square) `#F8F6F2` |
| [Basic](./basic/README.md) | ![#252525](https://img.shields.io/badge/-%23252525-252525?style=flat-square) `#252525` | ![#777771](https://img.shields.io/badge/-%23777771-777771?style=flat-square) `#777771` | ![#D8D5CE](https://img.shields.io/badge/-%23D8D5CE-D8D5CE?style=flat-square) `#D8D5CE` | ![#F5F3EF](https://img.shields.io/badge/-%23F5F3EF-F5F3EF?style=flat-square) `#F5F3EF` |
| [Streetwear](./streetwear/README.md) | ![#26352D](https://img.shields.io/badge/-%2326352D-26352D?style=flat-square) `#26352D` | ![#171A18](https://img.shields.io/badge/-%23171A18-171A18?style=flat-square) `#171A18` | ![#D7F27C](https://img.shields.io/badge/-%23D7F27C-D7F27C?style=flat-square) `#D7F27C` | ![#F3F4EE](https://img.shields.io/badge/-%23F3F4EE-F3F4EE?style=flat-square) `#F3F4EE` |
| [Outerwear](./outerwear/README.md) | ![#355C4A](https://img.shields.io/badge/-%23355C4A-355C4A?style=flat-square) `#355C4A` | ![#8EAD91](https://img.shields.io/badge/-%238EAD91-8EAD91?style=flat-square) `#8EAD91` | ![#E7B879](https://img.shields.io/badge/-%23E7B879-E7B879?style=flat-square) `#E7B879` | ![#F2F4ED](https://img.shields.io/badge/-%23F2F4ED-F2F4ED?style=flat-square) `#F2F4ED` |

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
