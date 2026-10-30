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

## An toàn
- Lịch bay, nhân sự, GSE và xe giao ca vẫn sử dụng cơ sở dữ liệu nghiệp vụ đã liên kết; việc xóa mã cũ khỏi nhánh chính không xóa dữ liệu Supabase.
- Không tự lấy số ví dụ làm dữ liệu ngày; khi chưa xác nhận báo cáo ghi rõ cần bổ sung.
- Người dùng ĐH/ADMIN kiểm tra kết quả xuất Word/PDF, ảnh/PDF trước khi phát hành chính thức.
