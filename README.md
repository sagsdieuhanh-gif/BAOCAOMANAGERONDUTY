# BAOCAOMANAGERONDUTY — SAGS-CXR

Ứng dụng **báo cáo dự báo điều hành khai thác** tại CXR.

Ứng dụng chạy trực tiếp tại thư mục gốc repository, không còn thư mục `radar-cxr/` và không triển khai SAGS FORM LITE/E-Report cũ trong bản phát hành hiện tại.

## Chức năng
- Lịch bay và dự báo khai thác theo ngày, cặp chuyến đến–đi.
- Báo cáo TGĐ (10 mục kiểm soát theo mẫu), xuất Word/PDF, có logo SAGS.
- Radar cao điểm độc lập, xuất Word/PDF.
- Xe giao ca theo 5 đơn vị, hai chiều xe, thêm giờ và lý do, lưu cả hai chiều một lần, xuất PNG/PDF.
- Nhập quân số ca sáng/ca đêm và đánh giá đủ/thiếu theo từng phòng.
- Ô dán nhanh thông tin nghiệp vụ của các phòng, lưu và gửi ĐH để tổng hợp vào báo cáo.

Mã nguồn các module ở thư mục gốc. `server/` lưu mã tham khảo và migration nghiệp vụ, `tests/` lưu kiểm thử. GitHub Pages chỉ đóng gói những file cần chạy và `assets/logo-sags.png`.

## Báo cáo dự báo Lần 2 (V2.28)
- Lần 1: giữ nguyên biểu mẫu chuẩn và cấu trúc kiểm soát theo mẫu hiện có.
- Lần 2: hợp nhất khung cao điểm, bãi đỗ/đường công vụ, tàu thân rộng, nhân lực, GSE, hàng hóa và chuyến đặc biệt trong **một bảng nhận định – nguy cơ – phương án – đơn vị thực hiện**; không lặp lại bảng 10 nội dung, cảnh báo cao điểm hay bảng phối hợp.
- Thông tin điều hành nhập thủ công, bổ sung từ các phòng và mục chờ xác nhận vẫn được bảo lưu, chỉ thể hiện riêng khi mang thông tin mới. Dữ liệu chưa được đơn vị xác nhận không tự suy đoán.
- Với bãi đỗ và đường công vụ, **PVSĐ chủ động phối hợp ATC**; với charter (ký hiệu ##), **Phòng Điều hành trao đổi hãng** rồi thông tin đến đơn vị liên quan; hàng đi phân tích theo số liệu Kho Hàng đã xác nhận và điều kiện thỏa thuận áp dụng.
- Preview và xuất Word/PDF của Lần 2 sử dụng cùng bố cục gộp.

## An toàn
- Lịch bay, nhân sự, GSE và xe giao ca vẫn sử dụng cơ sở dữ liệu nghiệp vụ đã liên kết; việc xóa mã cũ khỏi nhánh chính không xóa dữ liệu Supabase.
- Không tự lấy số ví dụ làm dữ liệu ngày; khi chưa xác nhận báo cáo ghi rõ cần bổ sung.
- Người dùng ĐH/ADMIN kiểm tra kết quả xuất Word/PDF, ảnh/PDF trước khi phát hành chính thức.

## V2.29 – Định mức nhân sự cho Báo cáo Lần 2
- Định mức nhập một lần theo đơn vị, vị trí và loại tàu thân hẹp/thân rộng; lưu Supabase cùng nguồn xác nhận, không tự mặc định số người. Trống = CHỜ ĐỊNH MỨC, 0 chỉ dùng nếu đơn vị xác nhận.
- Nhập quân số thật theo vai trò, ca sáng/đêm của từng ngày; so sánh tại khung 30 phút có cặp đến–đi cùng phục vụ. Chỉ tính chênh lệch khi đủ định mức và số xác nhận; tổng quân số chỉ cho biết thiếu tối thiểu, không chứng minh đủ từng vị trí.
- Báo cáo Lần 2: đối chiếu Lần 1, bảng quân số/nhu cầu cao nhất theo ca, nhận định/chuyến/khung giờ và phương án cụ thể, thông tin còn chờ xác nhận. Lần 1 giữ nguyên mẫu. Định mức check-in theo hợp đồng vẫn ở PVHK.
