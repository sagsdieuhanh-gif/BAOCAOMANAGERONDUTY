# HDSD BAOCAOMANAGERONDUTY V2.23 — GIỜ XE VÀ PHƯƠNG ÁN LẦN 2

## Xe giao ca: sáu giờ cố định
- **NHA → CXR: 07:00, 17:30, 19:30.**
- **CXR → NHA: 16:30, 18:30, 08:15 (+1).**
- Ngoài sáu mốc trên là xe thêm, phải nhập giờ và lý do theo nghiệp vụ.
- Giờ cố định **không được xóa dòng xe chính**. Khi thêm một dòng xe bổ sung cùng một giờ cố định, ĐH/ADMIN vẫn được xóa riêng dòng xe thêm mà không xóa mốc gốc.
- Mốc 19:30 được áp dụng trong màn hình nhập của ĐH/PVHK/PVSĐ/QA & IT, trong gợi ý tổ hợp xe 29/45 chỗ, trong báo cáo xem trước và file PNG/PDF. Nếu chưa có đơn vị nhập cho xe 19:30, ô hiển thị chưa xác nhận, **không tính là 0 người**.

## Báo cáo Lần 2: nhận định theo tình hình ngày cụ thể
Phần **BÁO CÁO → Báo cáo điều hành → Phương án phục vụ Lần 2** thay bảng nhận xét chung bằng các tình huống được rút ra từ nguồn Excel Lần 2 và xác nhận các phòng:
- Cao điểm phục vụ chồng lấn theo cặp 30 phút; phân biệt khung đạt từ 4 cặp với khung chỉ có nhiều chuyến nhất trong ngày. Chuyến quay đầu sát được ưu tiên giải quyết dứt điểm trước, sau đó mới chuyển lực lượng/thiết bị cuốn chiếu.
- Bãi đỗ khu 2 (38–42), khu 3 (56–71) theo các khung giờ cụ thể, ảnh hưởng tuyến xe công vụ. Không suy đoán vị trí chưa có trong lịch.
- Cùng gate và giờ boarding theo lịch đã nhập được coi là cơ sở; giờ dự tính theo hướng dẫn hành khách chỉ dùng để cảnh báo kiểm tra. ETA chậm hơn STA được nêu khi đã có nguồn.
- Booking, định mức quầy check-in được PVHK xác nhận theo hãng, lực lượng theo khung giờ, tình trạng thiếu (chỉ kết luận khi đủ dữ liệu). Booking không phải PAX thực tế.
- Xe thang, Cobus, bốc xếp, lái GSE, hạn chế trang thiết bị: đối chiếu số thực sự đã được nhập/xác nhận và quy ước dự báo. Không mặc định STD là mốc xe rảnh.
- A330/B777, kế hoạch cargo kg/giờ hàng sẵn sàng, các chuyến ferry và thay đổi Lần 2 so với Lần 1.
- Quân số PVHK, PVSĐ và ĐH khi phòng đã **XÁC NHẬN**, gồm sáng/đêm, số cần bố trí và chênh lệch thiếu nếu có.

Báo cáo chỉ đưa **tối đa 7 nhóm tình huống đáng chú ý** trong ngày, ưu tiên nhóm có chênh thiếu được xác nhận, không lặp lại nguyên một danh sách cố định mỗi ngày. Nội dung các phòng đã ghi và người soạn đã chỉnh trong ô nhận xét/phương án có quyền ưu tiên, không ghi đè bằng câu sinh tự động.

## Xuất báo cáo
Toàn bộ nội dung Phương án phục vụ Lần 2 hiện tại xuất từ cùng một bản xem trước, dùng cho cả Word và PDF. Giữ nguyên các mục khác trong báo cáo và hồ sơ Lần 1 làm nguồn đối chiếu. Không thay đổi số liệu nguồn để tạo ra sự đa dạng văn bản.

## Nghiệm thu
Workflow chạy các bài kiểm thử V2.16–V2.23; đặc biệt kiểm tra 6 giờ cố định, 7 cột xe, gợi ý PNG/PDF và nhận xét khác biệt giữa hai lịch bay giả lập trong kiểm thử. Việc kiểm tra trên điện thoại bằng tài khoản thực tế vẫn cần thực hiện sau deploy.
