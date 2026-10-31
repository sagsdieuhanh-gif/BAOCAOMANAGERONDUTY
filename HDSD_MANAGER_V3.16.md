# HƯỚNG DẪN BÁO CÁO LẦN 2 V3.16

## V3.16 – BÁO CÁO LẦN 2 TỰ HOÀN THIỆN TỪ LỊCH ĐÃ DUYỆT

**Luồng thực hiện:** Mở LỊCH BAY/EXCEL → tải file có đủ ARRIVAL và DEPARTURE → kiểm tra dữ liệu → chọn **DUYỆT VÀ LƯU LẦN 2**. Sau khi máy chủ xác nhận lưu, ứng dụng **tự dựng lại bản xem trước báo cáo** và **đồng bộ Báo cáo TGĐ trong workspace**, không cần nhập lại số liệu các phòng. Lần 1 không bị ghi đè và được dùng làm mốc đối chiếu.

**Quy tắc nhận định và trình bày:**
- Báo cáo Lần 2 sử dụng **đúng lịch, giờ STA/STD, bãi đỗ, gate, booking, tàu thân rộng, charter/ferry và các xác nhận của đơn vị đang lưu theo ngày**. Không lấy bãi ngày trước hoặc tự tạo giờ boarding. Booking không được coi là PAX thực đi.
- Mục I: thể hiện đối chiếu số lượt đến/đi **Lần 1 → Lần 2** theo số liệu từng snapshot; chỉ thêm so sánh ngày liền trước nếu có số liệu ngày đó được xác nhận, không chèn câu “chưa có dữ liệu ngày trước” làm kết luận chính khi đã có Lần 1.
- Mục II gồm **đủ 10 nội dung** với nhận định theo chứng cứ. Vị trí đỗ ghi số hồ sơ tại K1 (31–37, 51–55), K2 (38–42), K3 (56–71) và khung cao điểm liên quan; **PVSĐ là bộ phận trao đổi với ATC và tập kết phương tiện, thiết bị trước khi tàu bay lăn**. Phần nhân sự giữ quân số đã xác nhận và có bảng theo vị trí/ca; booking PVHK là thông tin tổ chức quầy, gate và đón/tiễn khách, không thay thế quân số, không tự kết luận đủ/thiếu theo định mức.
- Kho Hàng: nếu có KG booking đã nhập thì nêu rõ chuyến, KG và nhóm khối lượng có căn cứ; **không đánh giá bản báo cáo là chưa hoàn thiện chỉ do PCS hoặc ready-by đang trống**. Thông tin thực sự thiếu vẫn giữ trạng thái riêng tại nơi kiểm tra nguồn, không tự suy đoán. Cảnh báo có thể ẩn riêng trong PDF bằng tùy chọn từ V3.15.
- Các nội dung **an toàn, tồn tại và trang thiết bị** dùng ghi chú đã được đơn vị xác nhận nếu có; nếu không có ghi chú, chỉ trình bày nhiệm vụ theo lịch, không tự viết như đã xảy ra sự cố, và không khẳng định “không có tồn tại” khi chưa có nguồn.
- Không cắt câu bằng ký tự “…” hoặc các ngưỡng 155/225/290/460 ký tự khi dựng báo cáo Lần 2. Cả 3 khung cao điểm chọn lọc được giữ đầy đủ; Word/PDF theo bản xem trước. PDF tiếp tục A4 dọc. Các nội dung người dùng đã chỉnh và lưu trong kiểm soát báo cáo **được giữ ưu tiên**, không bị nhận định tự sinh ghi đè.
- Nếu file lịch Lần 2 thật sự thiếu dữ liệu bắt buộc, giữ cảnh báo kỹ thuật ở khâu duyệt/lưu và thông tin chờ xác nhận riêng, không tạo dữ liệu giả để làm báo cáo trông hoàn chỉnh.

**Ví dụ kiểm tra dữ liệu nguồn 01/11/2026:** Lần 1: 40 đến, 37 đi. Lần 2: 39 đến, 36 đi; 40 hồ sơ có bãi (K1 23, K2 6, K3 11), 36 chuyến đi có gate, 35 có booking, chưa có giờ boarding trong nguồn; Kho hàng đã lưu KG cho 9 chuyến. Những kết quả này là ví dụ kiểm tra tại thời điểm phát triển, không đóng cứng vào các ngày sau.
