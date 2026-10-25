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
| Shape chính | [shape-01.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-01.svg) | `--collection-accent` |
| Shape phụ | [shape-03.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-03.svg) | `--collection-secondary` |

**Định hướng:** Casual nên tạo cảm giác thoải mái, thân thiện và dễ tiếp cận. Đây là mục tiêu thiết kế, không phải kết luận hình học của hai asset. Cần xem trực tiếp gallery để xác nhận shape có hỗ trợ định hướng này hay không.

**Trạng thái:** mapping theo CSS mặc định hiện tại; chờ duyệt trực quan. Nếu thay đổi mapping, cập nhật [Shape Identity Matrix](../README.md#shape-identity-matrix) cùng lúc.

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
