# Streetwear — Color & Shape Identity

**Phạm vi:** trang collection Streetwear.

## Palette màu

| Vai trò | Preview | HEX |
|---|---|---|
| Primary — màu chính | ![#26352D](https://img.shields.io/badge/-%2326352D-26352D?style=flat-square) | `#26352D` |
| Secondary — màu phụ | ![#171A18](https://img.shields.io/badge/-%23171A18-171A18?style=flat-square) | `#171A18` |
| Accent — màu nhấn | ![#D7F27C](https://img.shields.io/badge/-%23D7F27C-D7F27C?style=flat-square) | `#D7F27C` |
| Paper — nền trang | ![#F3F4EE](https://img.shields.io/badge/-%23F3F4EE-F3F4EE?style=flat-square) | `#F3F4EE` |
| Ink — chữ mặc định | ![#171717](https://img.shields.io/badge/-%23171717-171717?style=flat-square) | `#171717` |

## Shape identity

| Vai trò | Asset hiện được cấu hình | Màu |
|---|---|---|
| Shape chính | [shape-15.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-15.svg) | `--collection-accent` |
| Shape phụ | [shape-52.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-52.svg) | `--collection-secondary` |

**Định hướng:** shape-15 có đường chéo mạnh và hình khối góc cạnh; shape-52 tạo điểm nhấn hướng tâm sắc nét. Kết hợp xanh đậm với lime để tạo năng lượng thị giác rõ cho Streetwear.

**Trạng thái:** đã chọn theo cấu trúc SVG; cần kiểm tra trực quan trên trang desktop/mobile trước khi chốt.

## CSS variables

Nguồn: `src/styles/wearo-collection-pages.scss`, selector `.wearo-collection-page[data-collection="streetwear"]`.

```scss
--collection-ink: #171717;
--collection-primary: #26352D;
--collection-secondary: #171A18;
--collection-accent: #D7F27C;
--collection-paper: #F3F4EE;
```

**Lưu ý:** Palette và shape trên đây thuộc trang collection Streetwear; chưa xác nhận là màu sắc hoặc asset của thẻ Streetwear trên trang chủ.
