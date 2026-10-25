# Casual — Color & Shape Identity

**Phạm vi:** trang collection Casual.

## Palette màu

| Vai trò | Preview | HEX |
|---|---|---|
| Primary — màu chính | ![#54728C](https://img.shields.io/badge/-%2354728C-54728C?style=flat-square) | `#54728C` |
| Secondary — màu phụ | ![#7794A6](https://img.shields.io/badge/-%237794A6-7794A6?style=flat-square) | `#7794A6` |
| Accent — màu nhấn | ![#F2CEAE](https://img.shields.io/badge/-%23F2CEAE-F2CEAE?style=flat-square) | `#F2CEAE` |
| Paper — nền trang | ![#F8F6F2](https://img.shields.io/badge/-%23F8F6F2-F8F6F2?style=flat-square) | `#F8F6F2` |
| Ink — chữ mặc định | ![#171717](https://img.shields.io/badge/-%23171717-171717?style=flat-square) | `#171717` |

## Shape identity

| Vai trò | Asset hiện được cấu hình | Màu |
|---|---|---|
| Shape chính | [shape-36.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-36.svg) | `--collection-accent` |
| Shape phụ | [shape-18.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-18.svg) | `--collection-secondary` |

**Định hướng:** shape-36 dùng nhịp cong nhiều cánh và shape-18 dùng cung tròn lặp lại; phối hợp với palette xanh và be để tạo cảm giác thân thiện, mềm hơn các collection còn lại.

**Trạng thái:** đã chọn theo cấu trúc SVG; cần kiểm tra trực quan trên trang desktop/mobile trước khi chốt.

## CSS variables

Nguồn: `src/styles/wearo-collection-pages.scss`.

```scss
--collection-ink: #171717;
--collection-primary: #54728C;
--collection-secondary: #7794A6;
--collection-accent: #F2CEAE;
--collection-paper: #F8F6F2;
```

**Lưu ý:** Palette và shape trên đây thuộc trang collection Casual; chưa xác nhận là màu sắc hoặc asset của thẻ Casual trên trang chủ.
