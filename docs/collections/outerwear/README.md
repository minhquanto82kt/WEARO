# Outerwear — Color & Shape Identity

**Phạm vi:** trang collection Outerwear.

## Palette màu

| Vai trò | Preview | HEX |
|---|---|---|
| Primary — màu chính | ![#355C4A](https://img.shields.io/badge/-%23355C4A-355C4A?style=flat-square) | `#355C4A` |
| Secondary — màu phụ | ![#8EAD91](https://img.shields.io/badge/-%238EAD91-8EAD91?style=flat-square) | `#8EAD91` |
| Accent — màu nhấn | ![#E7B879](https://img.shields.io/badge/-%23E7B879-E7B879?style=flat-square) | `#E7B879` |
| Paper — nền trang | ![#F2F4ED](https://img.shields.io/badge/-%23F2F4ED-F2F4ED?style=flat-square) | `#F2F4ED` |
| Ink — chữ mặc định | ![#171717](https://img.shields.io/badge/-%23171717-171717?style=flat-square) | `#171717` |

## Shape identity

| Vai trò | Asset hiện được cấu hình | Màu |
|---|---|---|
| Shape chính | [shape-32.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-32.svg) | `--collection-accent` |
| Shape phụ | [shape-67.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-67.svg) | `--collection-secondary` |

**Định hướng:** shape-32 dùng các dải bậc thang song song; shape-67 tạo khung hình học có điểm neo ở giữa. Cặp hình nhấn vào cảm giác lớp lang, cấu trúc và vững chãi của Outerwear.

**Trạng thái:** đã chọn theo cấu trúc SVG; cần kiểm tra trực quan trên trang desktop/mobile trước khi chốt.

## CSS variables

Nguồn: `src/styles/wearo-collection-pages.scss`, selector `.wearo-collection-page[data-collection="outerwear"]`.

```scss
--collection-ink: #171717;
--collection-primary: #355C4A;
--collection-secondary: #8EAD91;
--collection-accent: #E7B879;
--collection-paper: #F2F4ED;
```

**Lưu ý:** Palette và shape trên đây thuộc trang collection Outerwear; chưa xác nhận là màu sắc hoặc asset của thẻ Outerwear trên trang chủ.
