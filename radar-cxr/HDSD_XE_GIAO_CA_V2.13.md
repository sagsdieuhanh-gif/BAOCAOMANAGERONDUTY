# HƯỚNG DẪN XE GIAO CA — V2.13

## 1. Cảnh báo thiếu đơn vị ngay tại từng giờ xe
- Bảng nhập xe của các phòng và ảnh/PDF tổng hợp đều hiển thị đúng **những đơn vị chưa có số liệu xác nhận** ở mỗi dòng.
- Danh sách 5 đơn vị theo thứ tự: **ĐH, PVSĐ, PVHK, Kho Hàng, QA/IT**.
- Ví dụ một dòng đã có ĐH và PVHK: **CHƯA XÁC NHẬN: PVSĐ, Kho Hàng, QA/IT**.
- Số **0** là một xác nhận hợp lệ (không có người đi xe), không bị hiểu là chưa nhập.
- Dấu **~** trước tổng số người nghĩa là mới cộng tạm các phòng đã nhập; ứng dụng chỉ gợi ý xe 29/45 chỗ khi cả 5 đơn vị có dữ liệu.

## 2. Thêm giờ xe khác mẫu và ghi lý do
1. Vào bảng XE GIAO CA trong màn hình nhập của đơn vị mình.
2. Chọn chiều xe, giờ chạy, dấu **Ngày hôm sau (+1)** nếu xe chạy sau 0 giờ.
3. Nhập **Lý do thêm xe** — ví dụ `Xe hỗ trợ họp chuyên môn` — rồi bấm **THÊM MỐC GIỜ**. Ô lý do bắt buộc và có giới hạn 220 ký tự.
4. Giờ xe bổ sung khác các mốc mẫu hiển thị **nền cam nhạt, đường kẻ cam và nhãn GIỜ THÊM** trong bảng nhập và ảnh tổng hợp.
5. Ảnh/PDF hiển thị lý do thành một dòng **LÝ DO THÊM XE: ...** ngay bên dưới dòng mốc xe, cùng màu cam.
6. Có thể sử dụng dấu **+** của một mốc mẫu để tạo xe bổ sung cùng giờ. Mỗi dòng xe bổ sung cũng được tô nổi bật và có ô **Lý do thêm xe** cùng nút **LƯU LÝ DO**.

Lý do được lưu theo đúng `ngày + chiều + giờ xe + số dòng bổ sung`, độc lập với số người của từng phòng, nên không bị mất khi những phòng khác tiếp tục xác nhận số lượng. Người tạo dòng được sửa lý do của dòng mình; ĐH và ADMIN được sửa để phục vụ điều hành. Không cho sửa lý do của các mốc xe chuẩn.

## 3. Xem trước và xuất
- Vào tab **XE GIAO CA** để kiểm tra ảnh tổng hợp.
- Tài khoản ĐH/ADMIN sử dụng **XUẤT ẢNH PNG XE GIAO CA** hoặc **XUẤT PDF XE GIAO CA**.
- Bản xuất giữ đồng nhất với ảnh xem trước, gồm danh sách các đơn vị còn thiếu và các giờ xe bổ sung nổi bật.
- Chỉ bấm phát hành khi đã đối chiếu đầy đủ số liệu, nhất là các khung chưa có 5 đơn vị xác nhận.

## 4. Lưu ý và kiểm thử
- Dữ liệu số người xe giao ca cũ được giữ nguyên; bản cập nhật chỉ thêm thông tin `reason` cho các dòng phụ.
- Lý do được lưu trong bảng `ops_shift_transport_rows`, cập nhật qua RPC có xác minh quyền truy cập. Truy cập công khai không thể gọi RPC này.
- Có kiểm thử tự động cho: thiếu đơn vị, 0 là số hợp lệ, mốc xe khác giờ mẫu, lý do được lưu và có màu cam trong ảnh xuất.
- Cần thử thao tác với tài khoản từng phòng và kiểm tra trên điện thoại trước khi nghiệm thu vận hành thực tế.
