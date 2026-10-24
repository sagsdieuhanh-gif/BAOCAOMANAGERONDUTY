# HDSD SAGS FORM LITE V1.0

1. **ĐĂNG NHẬP:** dùng email/mật khẩu Firebase Authentication; AD cấp quyền tại `lite_users/{uid}`. DEMO `?demo=1` chỉ dùng để thử cục bộ.
2. **TẠO CHUYẾN:** người có quyền AD hoặc DH chọn ngày, nhập chuyến đến/đi, A/C Reg, STA/STD/ETD rồi bấm TẠO CHUYẾN. Không tạo chuyến trùng ngày và cặp số hiệu.
3. **NHẬN CHUYẾN:** bấm NHẬN CHUYẾN; nếu có người nhận khác, hệ thống từ chối. Khi nhận xong, mở hồ sơ có 6 biểu mẫu.
4. **NHẬP BIỂU MẪU:** chọn đúng mã mẫu, bấm ô trên giấy hoặc tìm trường trong panel bên phải; nhập/xóa giá trị, ký tay nếu ô chữ ký; bấm LƯU LÊN FIREBASE. Bản nháp lưu tạm trên máy. Nếu sửa trùng trên 2 máy, ứng dụng báo conflict thay vì ghi đè.
5. **XUẤT PDF:** chọn mẫu > XUẤT PDF. Phần mềm lấy hình nền mẫu cùng dữ liệu đã nhập, tạo tệp PDF theo từng trang; kiểm tra bố cục trước khi ký/in.
6. **SỔ TAY:** bấm SỔ TAY dưới màn hình; chọn hãng hoặc tìm theo hãng/nội dung; chỉ khi mở mới tải dữ liệu. AD có quản lý bản nháp/nhập JSON/Excel đơn giản, xuất JSON; bản nháp không tự cập nhật E-Report.
7. **A/C LIMITS:** AD xem danh mục chung; nhập tay/DÁN NHANH; REG/FLIGHT/BOTH; ASU theo ETD (nếu có) hoặc STD, hạn chế khác theo STA. Mốc kích hoạt T-10. Nhân viên bấm ĐÃ BIẾT để chuyển cảnh báo tiếp theo. **Chỉ bật quyền ghi chung sau khi kiểm tra Firebase.**
8. **AD TÀI KHOẢN:** tạo tài khoản đăng nhập trong Firebase Auth bằng quy trình quản trị an toàn, sau đó nhập UID và vai trò tại mục TÀI KHOẢN. Không được tự thêm ADMIN trên client nếu chưa có quyền AD.
9. **CẬP NHẬT:** bản mới chỉ triển khai khi nghiệm thu; không tự reload đang sử dụng. Nếu mở nhiều thiết bị, kiểm tra dữ liệu mới đã được tải.

## Cập nhật V1.1 · giao diện hiện đại (24/10/2026)

- Dashboard mới hiển thị 3 chỉ số: tổng số chuyến, số chuyến đã nhận, số chuyến chưa nhận. Dữ liệu lọc theo ngày đã chọn; nhấn **Làm mới** để tải lại.
- PC: thanh điều hướng dọc bên trái: Chuyến bay, Sổ tay, A/C Limits, Tài khoản (chỉ AD). Mobile: cùng bốn mục nằm thanh dưới.
- Thẻ chuyến bay hiển thị cặp số hiệu, chặng, STA, STD, A/C Reg và trạng thái đã nhận. Chọn **Mở hồ sơ** hoặc **Nhận**.
- Hồ sơ chuyến bay chứa 6 thẻ biểu mẫu 42.1 / 42.3 / 55.1 / 54 / 94 / 208. Chạm thẻ cần nhập, chọn ô trên ảnh mẫu hoặc tìm trường trong danh sách, sau đó **Lưu lên Firebase** và **Xuất PDF**.
- SỔ TAY và A/C LIMITS giữ nút riêng, không tải nội dung nặng khi chưa mở. Cảnh báo LIMITS vẫn hoạt động khi có phiên đăng nhập hợp lệ (trong giới hạn trình duyệt chạy foreground); chế độ sửa LIMITS chung đang khóa chờ xác nhận rules.
- Giao diện thay đổi không có nghĩa đã thay đổi cấu trúc biểu mẫu PDF và các quy tắc hạn chế. Trước khi khai thác thật phải hoàn thành nghiệm thu quyền, biểu mẫu, tính chính xác PDF và cảnh báo.