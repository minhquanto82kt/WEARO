# WEARO — Collection Color & Shape Identity

Tài liệu quản lý hệ thống nhận diện của 4 collection: **palette màu** và **shape gallery**. Mã màu được đối chiếu với CSS; mapping shape bên dưới phản ánh cấu hình CSS hiện tại trên nhánh `feature/product-admin`, chưa phải kết luận rằng hình đã được kiểm duyệt về mặt nhận diện.

## Shape Identity Matrix

| Collection | Định hướng nhận diện | Shape chính | Shape phụ | Màu áp dụng | Trạng thái |
|---|---|---|---|---|---|
| [Casual](./casual/README.md) | Thoải mái, thân thiện, cân bằng | [shape-36.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-36.svg) | [shape-18.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-18.svg) | `--collection-accent` / `--collection-secondary` | Đã chọn theo hình học SVG; cần kiểm tra render desktop/mobile |
| [Basic](./basic/README.md) | Tối giản, tiết chế | [shape-68.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-68.svg) | [shape-22.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-22.svg) | `--collection-accent` / `--collection-secondary` | Đã chọn theo hình học SVG; cần kiểm tra render desktop/mobile |
| [Streetwear](./streetwear/README.md) | Cá tính, năng động, tương phản | [shape-15.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-15.svg) | [shape-52.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-52.svg) | `--collection-accent` / `--collection-secondary` | Đã chọn theo hình học SVG; cần kiểm tra render desktop/mobile |
| [Outerwear](./outerwear/README.md) | Cấu trúc, lớp lang, vững chãi | [shape-32.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-32.svg) | [shape-67.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-67.svg) | `--collection-accent` / `--collection-secondary` | Đã chọn theo hình học SVG; cần kiểm tra render desktop/mobile |

**Cách đọc mapping:** shape chính đang được tô bằng `--collection-accent`; shape phụ bằng `--collection-secondary`. Các tên shape chỉ là mã asset, không tự mang ý nghĩa phong cách. Định hướng nhận diện là mục tiêu thiết kế cần kiểm tra bằng cách xem trực tiếp gallery và trang collection.

## Bảng màu

| Collection | Màu chính (Primary) | Màu phụ (Secondary) | Màu nhấn (Accent) | Nền trang (Paper) |
|---|---|---|---|---|
| [Casual](./casual/README.md) | ![#54728C](https://img.shields.io/badge/-%2354728C-54728C?style=flat-square) `#54728C` | ![#7794A6](https://img.shields.io/badge/-%237794A6-7794A6?style=flat-square) `#7794A6` | ![#F2CEAE](https://img.shields.io/badge/-%23F2CEAE-F2CEAE?style=flat-square) `#F2CEAE` | ![#F8F6F2](https://img.shields.io/badge/-%23F8F6F2-F8F6F2?style=flat-square) `#F8F6F2` |
| [Basic](./basic/README.md) | ![#252525](https://img.shields.io/badge/-%23252525-252525?style=flat-square) `#252525` | ![#777771](https://img.shields.io/badge/-%23777771-777771?style=flat-square) `#777771` | ![#D8D5CE](https://img.shields.io/badge/-%23D8D5CE-D8D5CE?style=flat-square) `#D8D5CE` | ![#F5F3EF](https://img.shields.io/badge/-%23F5F3EF-F5F3EF?style=flat-square) `#F5F3EF` |
| [Streetwear](./streetwear/README.md) | ![#26352D](https://img.shields.io/badge/-%2326352D-26352D?style=flat-square) `#26352D` | ![#171A18](https://img.shields.io/badge/-%23171A18-171A18?style=flat-square) `#171A18` | ![#D7F27C](https://img.shields.io/badge/-%23D7F27C-D7F27C?style=flat-square) `#D7F27C` | ![#F3F4EE](https://img.shields.io/badge/-%23F3F4EE-F3F4EE?style=flat-square) `#F3F4EE` |
| [Outerwear](./outerwear/README.md) | ![#355C4A](https://img.shields.io/badge/-%23355C4A-355C4A?style=flat-square) `#355C4A` | ![#8EAD91](https://img.shields.io/badge/-%238EAD91-8EAD91?style=flat-square) `#8EAD91` | ![#E7B879](https://img.shields.io/badge/-%23E7B879-E7B879?style=flat-square) `#E7B879` | ![#F2F4ED](https://img.shields.io/badge/-%23F2F4ED-F2F4ED?style=flat-square) `#F2F4ED` |

## Ý nghĩa các biến màu

- **Primary:** màu chủ đạo cho tiêu đề, nút hoặc thành phần nổi bật.
- **Secondary:** màu phụ để tạo tương phản và phân cấp.
- **Accent:** màu nhấn cho chi tiết cần thu hút chú ý.
- **Paper:** màu nền tổng thể của trang collection.
- **Ink:** màu chữ mặc định, hiện là `#171717`.

## Nguồn và phạm vi

- Palette được đối chiếu từ [`wearo-collection-pages.scss`](../../fashion-dream-try-on-main/src/styles/wearo-collection-pages.scss).
- Shape gallery nằm tại [`public/images/shapes-gallery`](../../fashion-dream-try-on-main/public/images/shapes-gallery).
- Mapping shape hiện phản ánh các mask trong CSS của trang collection; không khẳng định shape đã được kiểm duyệt trực quan hay đang được dùng trên thẻ collection ở trang chủ.
- Đây là palette của các **trang collection**, không khẳng định là màu nền chính xác của 4 thẻ trên trang chủ trong mục “WEARO / FIND YOUR STYLE”.

## Quy tắc cập nhật

1. Khi thay đổi CSS palette, cập nhật README của collection tương ứng và bảng tổng hợp này.
2. Khi đổi shape trong CSS, cập nhật Shape Identity Matrix và README collection tương ứng trong cùng thay đổi.
3. Dùng đường dẫn asset thực tế trong repository; không suy luận ý nghĩa hình chỉ từ số thứ tự file.
4. Trước khi đánh dấu mapping là đã duyệt, xem gallery trực quan và kiểm tra desktop/mobile.
5. Giữ mã HEX đồng nhất với CSS; ghi rõ phạm vi màu (trang collection hay thẻ trang chủ) để tránh nhầm lẫn.
