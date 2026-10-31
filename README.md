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

## V2.30 – Đường dẫn ĐỊNH MỨC riêng, nhận biết phiên bản
- Sau đăng nhập, vào **CẬP NHẬT → ĐỊNH MỨC NHÂN SỰ** (nút chính, không nằm trong Nâng cao). Điều hành/ADMIN xem và chỉnh tất cả phòng; PVSĐ, PVHK và Kho hàng chỉ chỉnh phần thuộc đơn vị mình. Người không có quyền không thấy mục.
- Trong phần ĐỊNH MỨC, nhập người/chuyến cho tàu thân hẹp và thân rộng, nguồn định mức, và quân số sáng/đêm thực tế. Bấm **LƯU ĐỊNH MỨC / QUÂN SỐ**. Định mức lưu dùng chung qua ngày; quân số theo ngày chọn. Cột trống là CHỜ XÁC NHẬN, không tự điền 0.
- Sau đăng nhập, góc trên bên phải hiển thị **Tên tài khoản – VAI TRÒ  V2.30** cạnh nút Đăng xuất. Nhãn phiên bản tăng khi phát hành và được nạp từ hằng `APP_VERSION` của bản giao diện.

## V2.31 – Định mức phục vụ tối thiểu và Báo cáo Lần 2 theo mẫu Lần 1
- Vào **CẬP NHẬT → ĐỊNH MỨC TỐI THIỂU**. Chọn hãng, tàu thân hẹp/thân rộng và đơn vị; chỉ nhập số tối thiểu theo công đoạn. Không còn yêu cầu nhập “nguồn định mức”, “quân số sáng” và “quân số đêm” trên giao diện này. Quân số thực có tiếp tục nhập ở phần nhân sự riêng.
- Các nhóm: CO kiêm Loading (chỉ 1 người đủ năng định); PVHK check-in, chia sẻ nhóm quầy và Skyboard, gate/boarding/thang; sân đỗ lái đầu kéo, lái băng chuyền, bốc xếp hầm và dưới sân; Kho hàng số nhân sự cho chuyến có hàng.
- **ĐIỀN MẪU GỢI Ý VJ THÂN HẸP** chỉ điền số minh họa do người dùng đề xuất trên giao diện, KHÔNG tự lưu hoặc coi là định mức WI/SLA. Chỉ khi nhân viên rà soát và bấm LƯU mới được dùng để dự báo. Quy tắc 2 chuyến cùng nhóm quầy được dùng chung khi khả thi theo giờ thực tế, chuyến thứ 3 thêm nhóm quầy.
- Báo cáo Lần 2 **giữ nguyên mẫu 5 mục, cấu trúc, bảng kiểm soát và thứ tự mục của Lần 1**. Không dựng bảng nhân lực ca sáng/đêm độc lập hoặc bảng nhận định Lần 2 riêng. Chỉ chèn ghi chú “Cập nhật Lần 2” ngắn dưới mục có dữ liệu mới (bãi đỗ, nhân lực, quầy/gate, hàng hóa). Không tự khẳng định đủ/thiếu nếu chưa xác nhận định mức, lịch sử dụng và quân số.
