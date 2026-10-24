# HDSD SAGS FORM LITE V1.2 · 24/10/2026

## Đăng nhập dùng chung với E-Report

1. Mở `https://sagsdieuhanh-gif.github.io/EREPORT/`.
2. Nhập **username E-Report hiện tại** (không cần email), hoặc nhập chính email Firebase đã cấp, và mật khẩu hiện đang dùng ở E-Report cũ.
3. Đối với quản trị viên `AD`, nhập **email Firebase** (không đăng nhập chỉ bằng `AD`). Không sử dụng mật khẩu AD bootstrap hard-code.
4. Ứng dụng lấy hồ sơ từ `users/{UID}` chung với E-Report. Nếu tài khoản bị khóa hoặc không có hồ sơ, liên hệ AD của E-Report.
5. Nếu hệ thống yêu cầu đổi mật khẩu, nhập mật khẩu mới từ 8 ký tự và xác nhận; sau khi thành công, mật khẩu mới sẽ áp dụng cho **cả hai ứng dụng**.

## Phân quyền và dữ liệu

- `ADMIN`/`AD`: quản trị hồ sơ chuyến Lite và xem danh sách tài khoản chung (chỉ đọc).
- `DH`/`ĐH`: tạo, nhận chuyến và nhập 6 biểu mẫu theo quyền.
- `CBTT`, `KH`, `VIEWER`: có thể xem chuyến/mẫu; cảnh báo A/C LIMITS tuân thủ vai trò được AD cấu hình.
- Tài khoản mới, thay đổi quyền, khóa hoặc reset mật khẩu phải thao tác trên E-Report cũ. Không tạo `lite_users` riêng.
- Dữ liệu chuyến Lite tiếp tục nằm trong `lite_flights`; không ghi đè hồ sơ chuyến E-Report cũ.

## Lưu ý triển khai

- Cần **gộp** `firebase/lite-firestore-fragment.rules` vào Rules hiện tại rồi kiểm thử trên Firebase; không ghi đè bộ rules gốc.
- Chưa xác nhận tích hợp bằng tài khoản thật; trình duyệt iOS/PC cần nghiệm thu trước khai thác.
- Giao diện hiện đại V1.1, SỔ TAY, A/C LIMITS và 6 mẫu biểu giữ nguyên.