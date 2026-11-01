# HƯỚNG DẪN V3.18 – QUÂN SỐ THEO CA

## V3.18 – NHÂN SỰ ĐH / PVHK / PVSĐ: MỖI PHÒNG MỘT HÀNG, HAI Ô CA SÁNG & CA TỐI

- Trong **BÁO CÁO LẦN 1 / LẦN 2** (và bản PDF/Word xuất từ phần Báo cáo TGĐ), bảng quân số có **ba hàng ĐH, PVHK và PVSĐ**, với các cột **Bộ phận | CA SÁNG | CA TỐI**. Một phòng không bị tách nhiều dòng theo vị trí.
- **ĐH:** ô CA SÁNG chứa quân số Điều phối ca sáng; ô CA TỐI chứa Điều phối ca tối.
- **PVHK:** ô CA SÁNG chứa **Đội đến: x người · Đội đi: y người**; ô CA TỐI chứa **Đội đến: a người · Đội đi: b người**. Các số vẫn độc lập, chỉ gộp cách hiển thị trong mỗi ca, không tự cộng thành số nhân viên độc lập.
- **PVSĐ:** ô CA SÁNG có **PVSĐ: ... · PVHLNG: ... · BỐC XẾP PVSĐ: ... · SKYONE: ...**; ô CA TỐI có bốn nhóm tương tự lấy từ nguồn ca tối. **PVSĐ** là tổng phòng đã được xác nhận, các nhóm còn lại không cộng thêm một lần vào tổng.
- Trong màn hình **PVHK** và **Phục vụ sân đỗ**, phía trên có **hai ô CA SÁNG và CA TỐI**, mỗi ô gộp các nhóm tương ứng để xem nhanh. Khi đã lưu, các ô nhập chi tiết thu gọn phía dưới, mở bằng **NHẬP / CHỈNH SỬA QUÂN SỐ CHI TIẾT**; khi chưa có dữ liệu chi tiết, mục mở sẵn để nhập.
- Cột hiển thị **CA TỐI** vẫn sử dụng bản ghi **ca ĐÊM** đã lưu ở cơ sở dữ liệu, **không đổi khóa ca hoặc điều chỉnh giờ ca**.
- Giá trị **0** đã xác nhận hiển thị **0 người**; thiếu bản ghi thì ghi **CHỜ XÁC NHẬN**, không ước đoán từ tổng phòng. Các số lái xe GSE/Cobus và các vai trò khác vẫn được giữ trong mục nhập chi tiết, không bị xóa khỏi cơ sở dữ liệu; cũng không đánh giá đủ/thiếu quân số theo định mức.
- Ví dụ dữ liệu nguồn 01/11/2026: **PVHK sáng** Đội đến 16, Đội đi 43; **PVHK tối** Đội đến 16, Đội đi 59. **PVSĐ sáng** Tổng 50, PVHLNG 15, Bốc xếp 8, SKYONE 9; **PVSĐ tối** Tổng 51, PVHLNG 15, Bốc xếp 7, SKYONE 11. Đây là ví dụ kiểm tra, không cố định cho các ngày sau.
