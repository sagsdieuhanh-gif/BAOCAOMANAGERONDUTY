# BÁO CÁO MANAGER ON DUTY V2.17 — LẦN NHẬP 2

## 1. Nguồn Excel Lần 2
Áp dụng cho mẫu như **Book4.xlsx** có hai bảng **ARRIVAL** và **DEPARTURE** (có thể mang tên sheet 1/2), với tiêu đề lần lượt ở phần đầu bảng và hàng tên cột `FlightNo, Registration, Aircraft, Route, STA/STD, ParkingBay, Gate, SSR, NatureOfFlight, Booking, CkiRow`...

**File mẫu Book4.xlsx ngày 31/10/2026** có 33 chuyến đến, 35 chuyến đi, 31 dòng booking định dạng ba thành phần. Đây là file làm mẫu cấu trúc; không tự ghi nội dung file này vào cơ sở dữ liệu vì người dùng chưa duyệt nguồn Lần 2.

## 2. Cách nhập
1. ĐH/ADMIN đăng nhập, mở **LỊCH BAY**, chọn file Excel trong ô nhập hiện có.
2. Hệ thống kiểm tra cấu trúc. Nếu nhận đủ hai bảng ARRIVAL/DEPARTURE, tự chuyển sang **LẦN NHẬP 2** và đọc đồng thời hai sheet. File Lần 1 `LB` vẫn theo quy trình cũ.
3. Hệ thống kiểm tra **ngày khai thác trên cả hai sheet**; nếu khác ngày, từ chối nhập.
4. Tự tải **snapshot Lần 1** đã lưu cùng ngày. Mở phần xem trước: thống kê đến/đi, số cặp ghép đăng bạ, số chưa ghép, tàu thân rộng, booking, ferry, khung tối, thay đổi bãi/STA/STD so với Lần 1.
5. ĐH xem các cảnh báo cần xác nhận. Khi hợp lệ, bấm **DUYỆT VÀ LƯU LẦN 2** để gọi giao dịch nhập chính thức. Nếu thiếu snapshot Lần 1 hoặc có mã chuyến không hợp lệ, nút duyệt bị khóa.
6. Sau khi lưu, tải lại Radar và báo cáo. Lần 1 không bị xóa khỏi `ops_forecast_snapshots` và vẫn là mốc so sánh.

## 3. Phân tích nghiệp vụ
- **Bến bãi:** lấy ParkingBay thực tế của từng chuyến; phân khu 1 (31–37 và 51–55), khu 2 (38–42), khu 3 (56–71). Khu 2–3 lưu ý thời gian di chuyển xe, thiết bị khi tàu lăn. Nếu cặp chuyến đến/đi không khớp bãi, nêu rõ để ĐH đối chiếu AOC.
- **Gate/boarding:** lấy Gate từ bảng DEPARTURE. Các chuyến cùng gate có STD gần nhau trong 45 phút chỉ là diện **cần kiểm tra**, không kết luận trùng boarding khi chưa có BDG Start/Finish.
- **Booking:** giữ đúng chuỗi gốc như `0/10/365`. Có thể cộng ba thành phần để nhận biết mức đặt chỗ cần chú ý, nhưng **không coi đó là số khách thực đi**, không tự điền PAX.
- **FERRY:** kiểm tra `SSR`, `NatureOfFlight` và `FlightType` đồng thời. Nếu `SSR=FERRY` nhưng `FlightType=PAX`, đưa vào **CẦN XÁC NHẬN**, không tự giả định không có khách hoặc không cần GSE.
- **Tàu thân rộng:** nhận diện A330/B777, nêu đúng chuyến, bến bãi, gate, booking, và phương án PVSĐ/PVHK theo giờ.
- **Khung tối:** các chuyến từ 18:00, đặc biệt AK/FD và hãng Hàn Quốc nếu có thật trong lịch; ưu tiên làm dứt điểm rồi điều chuyển nhân sự/thiết bị cuốn chiếu.
- **Giờ qua ngày:** mã `0010+`, `0040+`, `0140+` được hiểu là giờ sau 00:00 ngày tiếp theo, không gán về ngày trước.

## 4. Lưu ý về dữ liệu bất thường trong Book4.xlsx
- Các ô `43` lặp ở nhiều cột khác ý nghĩa (Remarks, TotalPax, SSR, Booking...) được xem là **giá trị mẫu cần kiểm tra** trong định dạng này, không tự nhận là 43 khách, 43 giờ hoặc trạng thái thật.
- Mã `##QQE530` xuất hiện ở bảng ARRIVAL và DEPARTURE. Dấu `##` cần được người lập nguồn xác nhận/chỉnh trên Excel trước khi duyệt; hệ thống không âm thầm coi đó là mã bay đã xác minh.
- Một chuyến có `SSR=FERRY`, `FlightType=PAX` cần xác minh tính chất.
- Giá trị chưa có được giữ thiếu/chờ xác nhận, không tự lấy số liệu ngày trước thay thế.

## 5. Xuất báo cáo
Tại **BÁO CÁO**, khi ngày đã có snapshot Lần 2, hệ thống tự đọc bản Lần 2 làm nguồn chính và vẫn đọc Lần 1 để đối chiếu; thêm bảng phân tích cụ thể bãi đỗ, gate, booking, ferry, các chuyến cần ưu tiên và thay đổi so với Lần 1. Báo cáo tiếp tục giữ logo SAGS, năm phần chính và văn phong điều hành. Xuất Word/PDF qua bộ xuất nội bộ hiện có.

**Kiểm thử và giới hạn:** Kiểm thử tự động mô phỏng hai bảng, ghép chính xác theo đăng bạ, ferry, booking, giờ +1 và bảo toàn mốc Lần 1. Cần nghiệm thu bằng tài khoản ĐH cùng file nguồn đã chỉnh sửa các trường chưa hợp lệ trước khi khẳng định nhập và xuất thành công trên điện thoại.
