# WEARO — Danh sách lệnh phát triển

Tài liệu này dành cho thư mục dự án `fashion-dream-try-on-main/`.

## 1. Mở đúng thư mục dự án

Mở Terminal / CMD tại thư mục có file `package.json`. Nếu đang ở thư mục gốc repository, chạy:

```bash
cd fashion-dream-try-on-main
```

## 2. Cài dependencies

Chỉ cần chạy khi mới clone dự án hoặc khi dependencies thay đổi:

```bash
npm install
```

Nếu dự án đã có `package-lock.json` và bạn muốn cài đúng phiên bản đã khóa, có thể dùng:

```bash
npm ci
```

## 3. Kiểm tra UX/UI luồng account

Lệnh kiểm tra các điều kiện tĩnh đã định nghĩa cho trang đăng nhập, đăng ký và account hub:

```bash
npm run test:account-ux
```

Hoặc chạy script có sẵn:
- Windows CMD: `scripts\\check-account-ux.cmd`
- Bash / Git Bash: `bash scripts/check-account-ux.sh`

Các kiểm tra này là regression checks tĩnh; chúng không thay thế kiểm thử trình duyệt, xác thực thật, hay xác nhận build/deploy thành công.

## 4. Chạy website ở môi trường phát triển

```bash
npm run dev
```

Mở URL mà terminal hiển thị (thường là `http://localhost:5173`). Dừng server bằng `Ctrl+C`.

## 5. Kiểm tra build production

```bash
npm run build
```

Chỉ xem là đạt khi lệnh kết thúc với exit code 0 và không có lỗi build.

## 6. Xem các lệnh đã khai báo trong package.json

```bash
npm run
```

## 7. Quy trình kiểm tra đề xuất trước khi push

```bash
npm run test:account-ux
npm run build
```

Nếu một lệnh thất bại, đọc thông báo lỗi đầu tiên và sửa nguyên nhân trước khi tiếp tục. Không đưa secrets, access tokens, mật khẩu hoặc file môi trường chứa thông tin nhạy cảm lên GitHub.
