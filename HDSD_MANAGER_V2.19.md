# BÁO CÁO MANAGER ON DUTY V2.19 — XE GIAO CA / PEAK HOURS / ĐIỀU PHỐI LẦN 2

## 1. Xe giao ca – xóa xe bổ sung và gợi ý xe
- Chỉ ĐH hoặc ADMIN thấy nút **× XÓA** ở các giờ xe tự thêm và dòng xe bổ sung. **Không xóa được các giờ cố định**: NHA→CXR 07:00/17:30; CXR→NHA 16:30/18:30/08:15 (+1).
- Khi xóa xe đã thêm, ứng dụng thông báo rõ **các đơn vị có số người đã nhập**. Sau khi xác nhận, dữ liệu số người và giờ xe tương ứng được xóa theo một giao dịch; hệ thống có bảng nhật ký lưu bản trước khi xóa. Hành động này không tự hoàn tác trong giao diện.
- Chỉ số 0 vẫn tính là một xác nhận hợp lệ. Khi **cả bốn đơn vị** (ĐH, PVHK, PVSĐ, QA & IT) đã xác nhận, bảng nhập và ảnh/PDF gợi ý theo tổng số người: **0: không cần xe; 1–29: 29 chỗ; 30–45: 45 chỗ; trên 45: cần phương án bổ sung xe**. Đây là gợi ý, quyết định xe thuộc ĐH.
- Xe thêm vẫn được nhận diện riêng, có lý do; tổng số người in lớn, đậm trong ảnh/PDF.

## 2. Peak Hours đúng cách trình bày của công ty
- **PEAK HOURS 24 GIỜ**: tổng hợp **24 ô giờ, từ 00:00–01:00 đến 23:00–24:00**. Theo STA đếm một lượt đến; theo STD đếm một lượt đi, phân bốn nhóm màu:
  1. **Quốc tế đến** (xanh dương)
  2. **Quốc tế đi** (cam)
  3. **Quốc nội đến** (xanh lá)
  4. **Quốc nội đi** (đỏ cam)
- Đếm các lượt chuyến theo giờ bay, **không coi một cặp đến–đi là một lượt duy nhất** trong biểu đồ Peak Hours. Nếu thiếu STA/STD hoặc chưa rõ chặng bay, liệt kê **chưa xác nhận**, không tự phân loại.
- **RADAR ĐIỀU PHỐI 30 PHÚT** là báo cáo **khác**: tính cặp tàu bay chồng lấn phục vụ theo thời lượng chuẩn; không so sánh trực tiếp số cột của biểu đồ Peak Hours với số cặp trên Radar.
- Chuyến qua 00:00 có đánh dấu **(+1)** được giữ trong lịch khai thác qua ngày; không tự đưa vào 24 giờ lịch của ngày trước.

## 3. Phân tích điều phối Lần 2 dạng tổng hợp
Sau khi nhập ARRIVAL + DEPARTURE và được ĐH duyệt, tại **BÁO CÁO TGĐ → XEM TRƯỚC / TẢI LẠI**:
- **Peak Hours** nằm gần đầu báo cáo, có biểu đồ 4 nhóm chuyến.
- **Bãi đỗ theo giờ và khu vực**: K1 (31–37, 51–55), K2 (38–42), K3 (56–71). Riêng K2–K3 đánh giá cụm chuyến có thể gây ảnh hưởng tuyến xe/thiết bị khi tàu lăn; không đoán bãi trống.
- **Gate boarding**: ưu tiên dùng BDG Start/Finish đã được xác nhận trong file. Nếu chưa có, sử dụng mốc tham chiếu công khai cho VJ, AK/FD và KE để **cảnh báo kiểm tra**, không kết luận đã có trùng gate hay giờ thực tế bị thay đổi. Dựa vào ETA (nếu có) so với STA để cảnh báo nguy cơ chuyến về muộn ảnh hưởng boarding; ETD là mốc dự kiến khi đã có, không tự sửa STD.
- **Thiết bị / nhân lực phục vụ**: so số cặp cần phục vụ đồng thời với GSE khả dụng đã được PVSĐ xác nhận (thang, Cobus, băng chuyền, đầu kéo), đối chiếu quân số bốc xếp và lái xe phân theo ca/khung giờ. Mốc tham chiếu về nhu cầu xe theo Radar hiện hành chỉ là quy ước dự báo, không phải định mức cho mọi hãng.
- **Cuốn chiếu chuyến 1 → 2 → 3 ...**: nêu các cặp chuyến thực tế chồng lấn không thể dùng cùng một nhóm nguồn lực; khi không chồng lấn, chỉ khuyến nghị điều chuyển sau khi hoàn tất công đoạn, xác nhận xe/người khả dụng và thời gian di chuyển. **STD không phải mốc xe được giải phóng chắc chắn**.
- **Nhân sự check-in / gate**: khi PVHK xác nhận định mức quầy/nhân viên theo hãng và có phân công nhân sự theo khung giờ, hệ thống mới tính nhu cầu/quân số chênh lệch; nếu chỉ có tổng quân số theo ca, chưa đủ dữ liệu chia cho quầy, boarding, đón khách.

## 4. PVHK nhập định mức hợp đồng theo hãng
Mở tab **PVHK** → **ĐỊNH MỨC QUẦY CHECK-IN THEO HÃNG**:
- Nhập **số quầy/chuyến**, **nhân viên/quầy**, **phút mở quầy trước STD**, **phút đóng quầy trước STD**, **nhân viên gate/chuyến**, và **nguồn hợp đồng/SLA/phương án hãng xác nhận**.
- Bấm **LƯU ĐỊNH MỨC HÃNG · MỘT LẦN**. Chỉ PVHK, ĐH hoặc ADMIN có quyền lưu; dữ liệu gắn **ngày khai thác + mã hãng**, không tự điền từ ví dụ.
- Nếu thiếu định mức/nhân sự theo vị trí, kết quả **CHỜ XÁC NHẬN**; không đưa ra kết luận đủ/thiếu giả tạo. Booking là số đặt chỗ dự kiến, không mặc định thành PAX thực tế.

## 5. Mốc tham khảo công khai và giới hạn
- **VJ:** Vietjet thông báo khách cần đến gate khoảng 40–50 phút trước STD, gate đóng 15–20 phút trước STD; giờ quầy check-in thay đổi theo quốc nội/quốc tế và sân bay. Tham khảo: https://www.vietjetair.com/en/pages/to-have-a-good-flight-1599448842652/how-to-check-in-1685510691899
- **AK/FD:** AirAsia yêu cầu khách có mặt ở gate tối thiểu 30 phút trước giờ khởi hành; quy định đóng gate riêng cho các chuyến khởi hành từ Việt Nam. Tham khảo: https://support.airasia.com/s/article/What-do-I-need-to-board-flight-on-time
- **KE:** Korean Air công bố bắt đầu boarding quốc tế khoảng 35 phút trước giờ khởi hành, đóng gate khoảng 10 phút trước. Tham khảo: https://www.koreanair.com/contents/plan-your-travel/at-the-airport/boarding-procedure/international-flights-boarding

Những quy định dành cho hành khách trên **không phải SLA bố trí nhân sự/GSE tại CXR**. Ngày thực tế nếu có BDG Start/Finish, ETA/ETD hoặc yêu cầu riêng của hãng, thông tin nguồn có xác nhận phải được ưu tiên. Hệ thống chỉ cảnh báo, không tự phán rằng hãng đã chậm boarding hay đơn vị thiếu người khi chưa có dữ liệu.

## 6. Kiểm thử và triển khai
CI kiểm tra Peak Hours 24 khung, 4 nhóm chuyến, chuyển từ nguồn Excel Lần 1/Lần 2, trùng/ước tính gate, tình trạng ETA trễ, công thức nguồn lực và sự thiếu dữ liệu hợp đồng. Phần quyền xóa xe đã kiểm tra tại cơ sở dữ liệu với AUDIT và EXECUTE chỉ cho người dùng đăng nhập; cần nghiệm thu bằng tài khoản ĐH/ADMIN thực tế trên điện thoại.
