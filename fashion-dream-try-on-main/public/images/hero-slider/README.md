# Hero Slider Images

Thư mục này lưu trữ các hình ảnh dùng cho khu vực **hero slider** (banner/slide nổi bật) của website Fashion Dream Try-On Shop.

## Mục đích

- Tập trung các ảnh được sử dụng trong những slide nổi bật ở đầu trang.
- Giúp quản lý, thay thế và bổ sung banner mà không đặt ảnh rải rác ở nhiều thư mục.
- Giữ đường dẫn tài nguyên nhất quán giữa các thành phần giao diện sử dụng hero slider.

## Cấu trúc

```text
public/
└── images/
    └── hero-slider/
        ├── README.md
        └── <các tệp hình ảnh của slide>
```

README này mô tả chức năng của thư mục; tên và số lượng ảnh thực tế được xác định theo các tệp đang có trong repository.

## Quy ước quản lý hình ảnh

- Ưu tiên tên tệp dễ hiểu, viết thường, không dấu; dùng dấu gạch ngang để phân tách từ. Ví dụ: `spring-collection.webp`.
- Dùng định dạng ảnh phù hợp với tài nguyên hiện có của dự án; ưu tiên WebP khi quy trình xử lý ảnh hỗ trợ, nhưng không đổi định dạng hàng loạt nếu chưa kiểm tra nơi đang sử dụng.
- Các ảnh trong cùng một slider nên có tỷ lệ khung hình, bố cục và chất lượng hiển thị tương đối đồng nhất.
- Tối ưu dung lượng ảnh để hạn chế ảnh hưởng đến thời gian tải trang.
- Trước khi đổi tên hoặc xóa ảnh, tìm tất cả nơi tham chiếu đến đường dẫn đó trong source code để tránh làm hỏng slide.
- Chỉ thêm ảnh có quyền sử dụng phù hợp với website.

## Cách tham chiếu ảnh

Vì thư mục nằm trong `public/`, đường dẫn công khai thường bắt đầu từ `/images/hero-slider/` (không bao gồm tiền tố `public`).

Ví dụ trong JSX/TSX:

```jsx
<img
  src="/images/hero-slider/your-image.webp"
  alt="Mô tả nội dung của banner"
/>
```

Thay `your-image.webp` bằng tên tệp thực tế có trong thư mục. Nếu slider đang dùng cấu hình dữ liệu hoặc component riêng, hãy giữ đúng cơ chế và quy ước hiện tại của dự án.

## Checklist khi cập nhật

1. Đặt ảnh mới vào thư mục này.
2. Kiểm tra tên tệp, định dạng, dung lượng và tỷ lệ ảnh.
3. Cập nhật danh sách slide hoặc đường dẫn tại đúng component/config đang sử dụng.
4. Kiểm tra giao diện ở desktop và mobile; xác nhận ảnh không bị méo, cắt sai trọng tâm hoặc làm vỡ bố cục.
5. Chạy các bước kiểm tra phù hợp của dự án trước khi merge/deploy.

> Lưu ý: Thư mục này chỉ quản lý tài nguyên hình ảnh. Không đặt API key, secret hoặc dữ liệu nhạy cảm trong thư mục `public`, vì các tệp ở đây có thể được truy cập công khai.
