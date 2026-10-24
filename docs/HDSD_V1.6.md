# HƯỚNG DẪN SỬ DỤNG SAGS FORM LITE V1.6

Ngày 24/10/2026. Bản sửa lỗi hiển thị dữ liệu E-Report gốc, kế thừa V1.5.

## Đăng nhập / xem phân công

1. Mở `https://sagsdieuhanh-gif.github.io/EREPORT/` và dùng username/mật khẩu E-Report hiện tại.
2. Chọn ngày khai thác. Mặc định là ngày của điện thoại/máy tính; có nút **Hôm qua**, **Hôm nay** và **Làm mới**.
3. Xem `NGUỒN DỮ LIỆU`: nhân viên dùng hộp phân công `roster_mail/{username}/items`, AD dùng danh mục `roster_manifests/{date}`. Các số đếm giải thích vì sao không hiện chuyến nào.
4. Chuyến có phân công hiện ra ngay cả khi phân công thuộc loại khác ngoài sáu mẫu; chỉ những mã tương ứng 42.1, 42.3, 55.1, 54, 94, 208 mới tính vào chỉ số `Nhiệm vụ thuộc 6 mẫu`.
5. Nút **MỞ NHIỆM VỤ GỐC** chuyển sang E-Report hiện hành để nhận việc/nhập/xuất PDF đúng dữ liệu gốc; không nhập sang một kho Lite khác.

## Xem hồ sơ chuyến gốc (chỉ AD)

1. Chọn ngày khai thác rồi bấm **XEM HỒ SƠ CHUYẾN ĐÃ LƯU**.
2. App chỉ khi đó mới đọc `flight_records/{date}`. Do dữ liệu nhiều, cần đường truyền ổn định. Hiển thị tối đa 100 dòng hồ sơ để tránh lag, có tổng số lượng.
3. Phần xem chỉ hiện tên/số hiệu, flightId, A/C Reg và tên module/chứng từ; không hiển thị nội dung dữ liệu hành khách, chữ ký hay tải toàn bộ dữ liệu vào một bản sao.
4. Nếu `permission_denied`, giữ nguyên phiên đăng nhập và không hiển thị dữ liệu không được phép xem. Quyền gốc do RTDB của E-Report kiểm soát.

## Phân biệt các trường hợp trống

- **Chưa có phân công trong ngày:** không khẳng định rằng không có hồ sơ chuyến trong `flight_records`.
- **Có nhiệm vụ khác nhưng chưa có 6 mẫu:** vẫn thấy chuyến, phần nhiệm vụ khác được ghi rõ.
- **Lỗi truy cập RTDB:** có cảnh báo riêng, không hiển thị sai bằng `0`.
- **Chỉ xem được danh mục mà chưa nhập form:** vẫn cần chạy luồng nhận việc và form/PDF của E-Report gốc. Đây là giới hạn của V1.6.

## SỔ TAY / A/C LIMITS

- SỔ TAY tiếp tục nạp nguyên module E-Report, không tạo dữ liệu hoặc chức năng quản trị thứ hai.
- LIMITS đọc danh mục chung; luồng cảnh báo T-10/phân quyền quản lý gốc vẫn cần chạy từ E-Report cũ. Không tự sửa dữ liệu LIMITS ngoài quyền.

## Lưu ý nghiệm thu

`npm test` và `npm run check` là kiểm thử logic, chưa chứng minh Firebase thật trả dữ liệu của tài khoản đang đăng nhập. Không thay đổi Firestore Rules hoặc RTDB Rules của dự án cũ khi phát hành V1.6.