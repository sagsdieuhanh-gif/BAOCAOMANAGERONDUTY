# BAOCAOMANAGERONDUTY V2.18 — XE GIAO CA & BÁO CÁO LẦN 2

## I. Lịch xe giao ca cố định
Chỉ có 05 mốc xe cố định dưới đây:
- **NHA → CXR:** **07:00** và **17:30**.
- **CXR → NHA:** **16:30**, **18:30** và **08:15 (+1)** (08:15 ngày hôm sau).

Các mốc giờ khác (kể cả 06:30, 09:00, 18:45, 19:30, 01:00+ nếu có) **không phải giờ cố định**. Phòng liên quan chọn **THÊM GIỜ XE KHÁC** theo đúng chiều và ngày, nhập **Lý do thêm xe**, sau đó lưu. Các dòng đã có từ phiên bản cũ không bị xóa để bảo toàn số liệu: giờ đó hiển thị như xe bổ sung.

## II. 04 đơn vị nhập và xác nhận
Bảng nhập và ảnh/PDF tổng hợp chỉ lấy đúng bốn đơn vị, theo thứ tự:
**ĐH → PVHK → PVSĐ → QA & IT** (QA/IT chung một cột).
Không đưa Kho Hàng vào số người và không dùng trạng thái Kho Hàng để quyết định đã đủ đơn vị xác nhận.

- Mỗi phòng nhập số người ở các mốc thuộc hai chiều; **0 là xác nhận hợp lệ**, ô trống nghĩa là chưa xác nhận.
- Bấm **LƯU TẤT CẢ THAY ĐỔI** để lưu số người và lý do xe bổ sung đã sửa, cho cả hai chiều.
- Bảng nhập nêu cụ thể tên phòng còn thiếu từng mốc.
- Ảnh/PDF có bố cục tinh gọn: **tổng số người** rất lớn và in đậm, tiếp theo là số người của 4 phòng, tình trạng xác nhận, lý do thêm xe màu cam.
- Khi chưa đủ cả 4 phòng, tổng số người là **tạm tính**; không được dùng làm số liệu đã chốt.

## III. Báo cáo dự báo Lần 2
**LỊCH BAY → Nhập Excel Lần 2:**
1. Chọn file có hai sheet **ARRIVAL** và **DEPARTURE**; hệ thống phân tích đồng thời hai bảng.
2. Xem đối chiếu Lần 1, bãi đỗ, gate, giờ/quầy check-in, booking, FERRY, tàu thân rộng, ca tối, thay đổi STA/STD.
3. Bấm **XEM TRƯỚC BÁO CÁO LẦN 2 (CHƯA LƯU)** để xem ngay bản dự thảo đầy đủ. Bản này có thông báo **CHƯA ĐƯỢC DUYỆT / CHƯA LƯU**; không dùng để phát hành.
4. Nếu nguồn đủ điều kiện, ĐH bấm **DUYỆT VÀ LƯU LẦN 2**. Bản Lần 1 vẫn được giữ nguyên làm mốc đối chiếu.

**BÁO CÁO → XEM TRƯỚC / TẢI LẠI:**
- Nếu đã có snapshot **Lần 2**, trạng thái ghi **LẦN 2 ĐÃ DUYỆT**, phần phân tích bãi/gate/booking/ferry và so sánh Lần 1 nằm **ngay sau phần I. TÓM TẮT KHAI THÁC**.
- Nếu chưa lưu Lần 2, màn hình báo **CHƯA CÓ LẦN 2 ĐÃ DUYỆT**; Word/PDF chưa được phép giả nhận là báo cáo Lần 2.
- Nút xuất Word/PDF tự đặt tên tệp **LAN_2** khi dùng nguồn Lần 2, hoặc **LAN_1** nếu chỉ có bản Lần 1.
- Chuyến có mã không chuẩn, giờ/gate/booking thiếu, hoặc tình trạng FERRY chưa thống nhất sẽ được nhắc kiểm tra; hệ thống không tự khẳng định dữ liệu đã xác nhận.

## IV. Kiểm tra
Bản V2.18 có kiểm thử tự động cho năm mốc cố định, bốn đơn vị, Kho Hàng không cộng vào tổng, số 0 hợp lệ, giờ cũ được giữ thành giờ bổ sung, và việc phân biệt Lần 1/Lần 2 trong báo cáo và tên Word/PDF. Các thay đổi cấu hình mốc cố định đã được áp dụng đồng bộ trong cơ sở dữ liệu cho chức năng thêm/sửa/xóa lý do xe.
