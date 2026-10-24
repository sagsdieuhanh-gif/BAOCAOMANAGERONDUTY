# HƯỚNG DẪN SỬ DỤNG – SAGS FORM LITE V1.3

Ngày cập nhật: 24/10/2026. Kế thừa giao diện mới V1.1 và cơ chế tài khoản E-Report chung V1.2.

## XEM TRƯỚC PDF

1. Đăng nhập tài khoản E-Report, mở ngày và chuyến cần thao tác.
2. Chọn một trong sáu mẫu: **42.1 / 42.3 / 55.1 / 54 / 94 / 208**.
3. Nhập dữ liệu, checkbox, thời gian, chữ ký vào các trường đúng mẫu. Có thể chuyển trang trong mẫu 2 trang.
4. Bấm **👁 XEM TRƯỚC PDF**. Ứng dụng chỉ lúc đó mới tạo PDF từ ảnh mẫu gốc và dữ liệu đang hiển thị.
5. Kiểm tra đủ trang, tên chuyến, ô dữ liệu và chữ ký. Nếu có cảnh báo **CHƯA LƯU FIREBASE**, cần đóng xem trước và bấm **LƯU LÊN FIREBASE**.
6. Trong cửa sổ xem trước: **LƯU PDF** tải đúng PDF vừa xem; **MỞ PDF** mở trong ứng dụng ngoài/tab trình duyệt; **ĐÓNG** quay lại biểu mẫu.
7. Nút **⬇ XUẤT PDF** tại màn hình biểu mẫu tải cùng loại PDF, không tự động hoàn tất hoặc lưu dữ liệu.

## BẢO TOÀN BIỂU MẪU / CHỮ KÝ

- PDF có đủ số trang gốc (42.1/42.3/55.1 hai trang; 54/94/208 một trang); mẫu 208 giấy A4 ngang.
- Nền mẫu và lớp dữ liệu được căn cùng tỷ lệ, không làm biến dạng kích thước của trang gốc.
- Chữ ký được giữ đúng nội dung ảnh và tỷ lệ, không kéo dãn; báo lỗi khi ảnh chữ ký không đọc được.
- Nếu sửa bất kỳ trường nào sau khi đóng xem trước, lần xem tiếp theo sẽ dựng lại PDF mới.
- Việc **xem trước**, **tải**, **mở PDF** không tự động lưu dữ liệu Firebase; nhân viên phải bấm LƯU LÊN FIREBASE.
- Nếu điện thoại không hiển thị PDF trong khung, bấm **MỞ PDF** để dùng trình xem PDF trên điện thoại.

## LƯU Ý KHI KIỂM DUYỆT

- Biểu mẫu gốc/ảnh và Form Registry lấy đúng phiên bản E-Report đã pin SHA; không tự thiết kế lại mẫu.
- Trên bản hiện tại, thao tác đặc thù và các trường chữ ký mẫu 54/94/208 chưa được nghiệm thu tương đương với app E-Report. Cần so sánh bản in từng trang trên thiết bị thực.
- Đăng nhập dùng Firebase Authentication E-Report; hồ sơ tài khoản users/{UID}; dữ liệu chuyến Lite lưu riêng.
- SỔ TAY và A/C LIMITS không bị thay đổi bởi phát hành V1.3.