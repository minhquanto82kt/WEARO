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
| Shape chính | [shape-03.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-03.svg) | `--collection-accent` |
| Shape phụ | [shape-01.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-01.svg) | `--collection-secondary` |

**Định hướng:** Outerwear nên gợi cảm giác cấu trúc, lớp lang và vững chãi; màu xanh rừng, xanh sage và vàng ấm hiện có hỗ trợ định hướng này. Cần xem trực tiếp gallery để xác nhận hai asset phù hợp.

**Trạng thái:** mapping theo CSS hiện tại; chờ duyệt trực quan. Nếu thay đổi mapping, cập nhật [Shape Identity Matrix](../README.md#shape-identity-matrix) cùng lúc.

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
