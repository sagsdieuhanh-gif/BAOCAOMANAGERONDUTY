# HƯỚNG DẪN V3.20 – NHÂN SỰ VÀ BOOKING KHO HÀNG

## V3.20 – NHẬP QUÂN SỐ THEO TỔ/ĐỘI VÀ BOOKING HÀNG ĐI/HÀNG ĐẾN

### Quân số PVHK
- Hai khung **CA SÁNG** và **CA TỐI**. Mỗi khung có ba ô độc lập: **Cán bộ Phòng**, **Đội PVHK đi**, **Đội PVHK đến**.
- Không bắt buộc ca tối có Cán bộ Phòng; ô trống là chưa xác nhận, không tự điền 0. Không dùng tổng số đội để suy ra tổng biên chế Phòng.
- Ví dụ để kiểm tra giao diện (không tự lưu dữ liệu vào ngày khai thác): sáng 01/33/14; tối chưa xác nhận/33/15.

### Quân số PVSĐ (KTS)
- Mỗi ca có sáu nhóm: **Cán bộ Phòng**, **Đội PVSĐ**, **HLSĐ**, **HLNG**, **Đội PVTT**, **Xưởng SC**.
- HLSĐ nhập 2 số: **Chính / SKO**; HLNG nhập 2 số: **Chính / SKO**; PVTT nhập 3 số: **Chính / TC / SKO**. Các nhóm còn lại mỗi nhóm nhập 1 số theo ca. **SKO** là SKYONE; **TC** là tăng cường. Không gán nhân sự SKYONE tổng cũ vào từng nhóm khi chưa xác nhận.
- Ví dụ thử giao diện: sáng Cán bộ 1, Đội PVSĐ 18, HLSĐ 9+9 SKO, HLNG 11+4 SKO, PVTT 13+3 SKO, Xưởng SC 7; tối Cán bộ 1, Đội PVSĐ 16, HLSĐ 7+11 SKO, HLNG 10+4 SKO, PVTT 13+3 TC+3 SKO, Xưởng SC 0.
- Phần **Các nhóm nhập theo cấu trúc cũ / bổ sung** vẫn giữ được các số lái xe GSE/COBUS và SKYONE tổng từ phiên bản trước để chỉnh sửa; không tự cộng số này vào nhóm mới. Dữ liệu đã có trong DB không bị xóa.
- Phần báo cáo L1/L2 và Word/PDF vẫn giữ 3 hàng ĐH / PVHK / PVSĐ, 2 cột ca sáng/tối. Trong ô PVHK hoặc PVSĐ, hiển thị đầy đủ từng nhóm có số liệu và riêng SKO/TC. Không cộng trùng hoặc suy đoán quân số phòng.

### Booking Kho Hàng
- **Kho Hàng → BOOKING HÀNG HÓA** chia 2 bảng riêng **CHUYẾN BAY ĐI** và **CHUYẾN BAY ĐẾN**.
- Mỗi dòng: **Số hiệu chuyến | Booking | KG/TẤN | PCS | Giờ hàng sẵn sàng**. KG/TẤN là lựa chọn bắt buộc, hệ thống **chuyển tất cả về kg để lưu**; số lượng được cộng tự động riêng theo từng chiều.
- **Hàng đi**, dòng mới mặc định **TẤN**; **hàng đến**, dòng mới mặc định **KG**. Phải kiểm tra đúng đơn vị từng dòng, không suy ra đơn vị từ giá trị số. Khi đọc số cũ đã lưu theo KG, biểu mẫu có thể hiển thị từ 1.000 kg trở lên dưới đơn vị tấn nhưng không thay đổi giá trị gốc.
- Kiểm tra ví dụ người dùng gửi, chưa lưu vào dữ liệu thật: hàng đi VU1270 1 tấn; VJ730 2,5 tấn; VJ1782 1,5 tấn; VJ1774 1,5 tấn; VJ770 2,5 tấn; TW034 1,5 tấn. **Tổng hàng đi 10,5 tấn = 10.500 kg.** Hàng đến VJ731 500 kg; VJ1781 500 kg; VJ771 300 kg. **Tổng hàng đến 1,3 tấn = 1.300 kg.**
- Mỗi booking chỉ được ghi cho số hiệu chuyến có trong đúng chiều lịch bay của ngày đang nhập. Booking đã lưu trước đây được đối chiếu với số hiệu trong lịch để đưa về bảng đi hoặc đến; nếu không khớp, nằm trong mục **Không xác định được chiều chuyến**, không tự phân vào bảng nào.
- **PCS và giờ hàng sẵn sàng là tùy chọn**, không bị coi là “thiếu booking KG” khi chưa có nguồn. 0 kg chỉ hợp lệ khi Kho Hàng đã xác nhận thực sự.
- Phần báo cáo tách tổng hàng đi và hàng đến, ưu tiên phương án xe kéo/xếp hàng đi theo booking và ground time; đối với hàng đến, lập phương án dỡ, tiếp nhận và vận chuyển về kho. Không cộng hàng đến vào trọng lượng hàng đi.
- Bản V3.20 giữ nguyên cơ chế lưu Supabase theo số chuyến/ngày, không tự điền số liệu ví dụ và không thay đổi các dòng dữ liệu thật nếu chưa có thao tác lưu.
