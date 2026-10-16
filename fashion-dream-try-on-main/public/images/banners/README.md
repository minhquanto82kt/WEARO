# WEARO — Banner Assets

Thư mục lưu trữ banner quảng bá và hình ảnh giới thiệu tính năng trên website WEARO.

## 1. Danh sách banner

| File | Mục đích | Trạng thái |
|---|---|---|
| `wearo-ai-virtual-tryon-banner.png` | Giới thiệu tính năng AI Virtual Try-On trên trang `/shop` | Dự kiến sử dụng |
| `wearo-shop-collection-2026.png` | Giới thiệu bộ sưu tập năm 2026 | Dự kiến sử dụng |
| `wearo-promotion-banner.png` | Banner chương trình khuyến mãi | Dự kiến sử dụng |

> Danh sách trên ghi nhận quy hoạch tên file; không có nghĩa các ảnh đã được thêm vào repository.

## 2. Quy ước đặt tên

- Dùng chữ thường và dấu gạch ngang (`kebab-case`).
- Đặt tên mô tả thương hiệu, mục đích hoặc chiến dịch.
- Không lưu ảnh sản phẩm hoặc ảnh bài viết trong thư mục này.
- Không ghi đè banner đang được sử dụng nếu chưa kiểm tra các nơi tham chiếu đến file.

## 3. Kích thước và tối ưu ảnh

- Giữ tỷ lệ ảnh gốc khi có thể; xác định cách hiển thị responsive trước khi crop.
- Tối ưu dung lượng ảnh để giảm thời gian tải trang.
- Nếu cần banner mobile riêng, đặt tên rõ ràng, ví dụ `wearo-ai-virtual-tryon-banner-mobile.webp`.
- Đảm bảo chữ, logo và người mẫu không bị cắt ở các breakpoint phổ biến.

## 4. Sử dụng trong website

Các tệp nằm trong `public/` được phục vụ từ URL gốc, không bao gồm tiền tố `public`.

Ví dụ URL công khai:

`/images/banners/wearo-ai-virtual-tryon-banner.png`

Ví dụ React:

```tsx
<img
  src="/images/banners/wearo-ai-virtual-tryon-banner.png"
  alt="WEARO AI Virtual Try-On"
/>
```

## 5. Checklist trước khi đưa lên production

- [ ] File ảnh đã tồn tại trong repository và đúng đường dẫn.
- [ ] URL ảnh tải thành công trên môi trường Preview.
- [ ] CTA dẫn đến đúng trang hoặc tính năng.
- [ ] Banner hiển thị tốt trên desktop và mobile.
- [ ] Không làm ảnh hưởng header, footer, bộ lọc hoặc danh sách sản phẩm.
- [ ] Dung lượng ảnh đã được tối ưu.
