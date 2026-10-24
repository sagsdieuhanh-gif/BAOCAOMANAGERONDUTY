# HƯỚNG DẪN SAGS FORM LITE V1.9 — CỔNG NGHIỆP VỤ GỐC

Ngày 24/10/2026. V1.9 dùng hệ thống E-Report gốc tại commit `41ad37fc9033f160fd00c21008ff9711ddfd7294` như **nguồn xử lý nghiệp vụ duy nhất** cho nhận việc, chuyển giao, nhập/lưu biểu mẫu, chữ ký, PDF và quản trị A/C LIMITS.

## 1. Phân công / nhận việc / chuyển giao
1. Đăng nhập tài khoản E-Report đang sử dụng và chọn ngày khai thác.
2. Mở **NGHIỆP VỤ** hoặc nút **PHÂN CÔNG / NHẬN VIỆC TRONG LITE**.
3. Trong màn hình gốc được nhúng, chọn **MỞ PHÂN CÔNG / NHẬN VIỆC**.
4. Theo quy trình E-Report cũ, xem phân công, xác nhận nhận, điều chuyển/nhận bàn giao nếu tài khoản được phép. Mỗi thao tác do hệ thống gốc kiểm tra quyền; Lite không tự ghi assignment.
5. Nếu cửa sổ gốc yêu cầu đăng nhập, dùng **cùng tài khoản E-Report** và bấm lại nút mở. Không truyền mật khẩu qua khung.

## 2. Mở đúng 6 biểu mẫu từ danh sách phân công
1. Tại danh sách chuyến trong Lite, tìm chuyến/ngày và nhiệm vụ thuộc 42.1, 42.3, 55.1, 54, 94 hoặc 208.
2. Chọn **NHẬN / MỞ MẪU · XUẤT PDF**. Trong màn hình nhúng, bấm **MỞ ĐÚNG NHIỆM VỤ**.
3. Lite chuyển đúng ba khóa gốc (`assignmentId`, `flightId`, `date`) vào hàm `sagsV478OpenExactAssignment` của E-Report. E-Report kiểm tra quyền, trạng thái và chính sách biểu mẫu; không bỏ qua điều kiện của bản cũ.
4. Nhập và lưu trực tiếp trên giao diện biểu mẫu gốc trong khung. Giữ nút **LƯU**, ký tay và xác nhận nghiệp vụ như bản E-Report. **Không sử dụng biểu mẫu DEMO để ghi công việc thực tế**.
5. Khi làm xong, dùng nút **XUẤT PDF / XEM TRƯỚC PDF** của E-Report trong khung. File PDF, chữ ký, dàn trang và chức năng chia sẻ do bộ xử lý gốc sinh ra. Không dùng PDF demo từ dữ liệu giả.

## 3. A/C LIMITS đầy đủ
1. Vào **A/C LIMITS** từ thanh menu Lite. Phần mềm nạp E-Report nghiệp vụ nguyên bản trong khung.
2. Chọn **MỞ QUẢN LÝ A/C LIMITS**. Module gốc quyết định quyền quản lý, nhập/sửa/bật/tắt, lưu và phát cảnh báo theo quy tắc đang hoạt động.
3. Cảnh báo gốc tự hoạt động **khi ứng dụng E-Report được nhúng đang mở và có phiên xác thực**. Ở các màn hình Lite khác, cảnh báo phụ trợ chỉ đánh giá trên những chuyến thuộc hộp phân công đang tải; không thay cho mọi cảnh báo E-Report của toàn đơn vị. Người trực vẫn cần chạy E-Report gốc cho đến khi nghiệm thu các cảnh báo chạy nền độc lập.

## 4. PDF và bảo vệ dữ liệu
- Tất cả thao tác thực tế qua khung chạy **ứng dụng gốc**, không tạo `lite_flights`, tài khoản, hồ sơ hay chữ ký Lite.
- Nếu chưa lưu biểu mẫu, **không** bấm chuyển trang/chuyển mục hoặc tải lại khung; thao tác này có thể mất bản nháp trong trang gốc.
- Khi nhúng chạy khác tên miền hoặc người dùng trong khung khác UID với Lite, các nút tự động mở nhiệm vụ bị chặn; người dùng có thể thao tác trong giao diện gốc theo quyền của mình.
- Không cập nhật Rules hoặc dữ liệu Firebase gốc; các nhánh nghiệp vụ sử dụng `sags_live_v470` theo mã E-Report đã xác minh.

## 5. Trạng thái nghiệm thu và giới hạn
- **Đã có bằng mã nguồn**: nạp bản E-Report gốc cùng tên miền và chuyển hàm xử lý phân công/nhiệm vụ/LIMITS; dùng biểu mẫu, chữ ký và PDF gốc trong khung.
- **Chưa nghiệm thu bằng tài khoản thực trên môi trường vận hành**: đăng nhập đồng nhất giữa Lite và khung, nhận/chuyển việc với nhiều vai trò, ghi biểu mẫu của cả 6 mẫu, xuất đủ 9 trang/ảnh chữ ký, hiệu lực cảnh báo T-10 trên từng thiết bị, iOS/Android.
- V1.9 là **giai đoạn tích hợp có chức năng nghiệp vụ gốc**, chưa xác nhận là bản thay thế độc lập hoàn chỉnh. Việc người dùng chỉ thấy một giao diện Lite thuần (không có khung giao diện gốc) cần giai đoạn tích hợp tiếp theo, không được gọi hoàn thành.