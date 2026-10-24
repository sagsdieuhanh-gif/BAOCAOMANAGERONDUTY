# HƯỚNG DẪN SỬ DỤNG SAGS FORM LITE V1.4 – Quyền Firebase

Ngày cập nhật: 24/10/2026. Kế thừa HDSD V1.3, giữ nguyên giao diện, 6 mẫu, PDF, SỔ TAY và A/C LIMITS.

## Lỗi truy cập sau đăng nhập

1. Dùng tài khoản và mật khẩu E-Report cũ; **không tạo tài khoản Lite riêng**.
2. Nếu màn hình hiện **Không thể tải dữ liệu chuyến bay** và nói `lite_flights` chưa được cấp quyền, tài khoản đã được Firebase xác thực và hồ sơ E-Report đã đọc được. Đây **không phải lỗi mật khẩu**.
3. Bấm **KIỂM TRA LẠI QUYỀN TRUY CẬP** sau khi AD đã được thông báo và người quản trị Firebase triển khai đúng rules.
4. Khi lỗi truy cập chuyến tồn tại, số lượng chuyến hiển thị `—` thay vì `0`, và nút tạo chuyến được ẩn để tránh báo thành công sai. Có thể mở SỔ TAY và A/C LIMITS nếu các module được cấp quyền.
5. Nếu thông báo nói không đọc được `users/{UID}`, cần người quản trị kiểm tra hồ sơ E-Report và rules đọc hồ sơ. Không tự đổi mật khẩu nhằm sửa lỗi này.
6. Không dùng `?demo=1` để thay thế dữ liệu khai thác thực tế. DEMO chỉ lưu dữ liệu trên máy, tách khỏi Firebase.

## Dành cho người quản trị

- Kiểm tra tài liệu `docs/FIREBASE_ACCESS_V1.4.md` để tích hợp fragment vào rules **đang hoạt động**, không ghi đè rules gốc.
- Kiểm thử riêng 3 vai trò: ĐH (xem, tạo, nhận, sửa đúng chuyến), AD (quản trị), VIEWER (chỉ xem).
- Không gỡ/hạ cấp quy tắc các collection E-Report khác.
- Khi Firebase Rules được phát hành, chỉ cần tải lại danh sách chuyến trong ứng dụng; không cần tạo tài khoản mới.

## Các nghiệp vụ còn lại

- Quy trình XEM TRƯỚC PDF, LƯU PDF và chữ ký: xem HDSD V1.3.
- SỔ TAY/A/C LIMITS: không thay đổi nghiệp vụ trong V1.4.