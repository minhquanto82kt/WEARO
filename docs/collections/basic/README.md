# Basic — Color & Shape Identity

**Phạm vi:** trang collection Basic.

## Palette màu

| Vai trò | Preview | HEX |
|---|---|---|
| Primary — màu chính | ![#252525](https://img.shields.io/badge/-%23252525-252525?style=flat-square) | `#252525` |
| Secondary — màu phụ | ![#777771](https://img.shields.io/badge/-%23777771-777771?style=flat-square) | `#777771` |
| Accent — màu nhấn | ![#D8D5CE](https://img.shields.io/badge/-%23D8D5CE-D8D5CE?style=flat-square) | `#D8D5CE` |
| Paper — nền trang | ![#F5F3EF](https://img.shields.io/badge/-%23F5F3EF-F5F3EF?style=flat-square) | `#F5F3EF` |
| Ink — chữ mặc định | ![#171717](https://img.shields.io/badge/-%23171717-171717?style=flat-square) | `#171717` |

## Shape identity

| Vai trò | Asset hiện được cấu hình | Màu |
|---|---|---|
| Shape chính | [shape-02.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-02.svg) | `--collection-accent` |
| Shape phụ | [shape-04.svg](../../fashion-dream-try-on-main/public/images/shapes-gallery/originals/shape-04.svg) | `--collection-secondary` |

**Định hướng:** Basic nên ưu tiên sự tối giản, tiết chế và cân bằng để không cạnh tranh với sản phẩm. Đây là mục tiêu thiết kế; cần xem trực tiếp gallery để xác nhận hai asset phù hợp.

**Trạng thái:** mapping theo CSS hiện tại; chờ duyệt trực quan. Nếu thay đổi mapping, cập nhật [Shape Identity Matrix](../README.md#shape-identity-matrix) cùng lúc.

## CSS variables

Nguồn: `src/styles/wearo-collection-pages.scss`, selector `.wearo-collection-page[data-collection="basic"]`.

```scss
--collection-ink: #171717;
--collection-primary: #252525;
--collection-secondary: #777771;
--collection-accent: #D8D5CE;
--collection-paper: #F5F3EF;
```

**Lưu ý:** Palette và shape trên đây thuộc trang collection Basic; chưa xác nhận là màu sắc hoặc asset của thẻ Basic trên trang chủ.
