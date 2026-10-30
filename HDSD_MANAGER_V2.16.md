# HDSD BAOCAOMANAGERONDUTY V2.16

## 1. Truy cập và nhập liệu
Truy cập thẳng trang chủ GitHub Pages **BAOCAOMANAGERONDUTY/** (không thêm `radar-cxr/`). Đăng nhập đúng tài khoản/đơn vị. Chọn ngày khai thác.

Mỗi phòng nhập thông tin nghiệp vụ như đang sử dụng; có thể dán nhanh nhiều dòng vào **DÁN NHANH NỘI DUNG BÁO CÁO**, bấm **LƯU & GỬI ĐH**. Nội dung dán được lưu theo ngày và phòng, có tên đơn vị khi tổng hợp; không âm thầm biến thành kết luận thiết bị đã khắc phục.

## 2. Quân số phục vụ bay
ĐH, PVHK, PVSĐ/KTSĐ có hai hàng riêng cho **CA SÁNG** và **CA ĐÊM**, mỗi hàng gồm **Tổng quân số**, **Nhu cầu (nếu biết)** và **Đánh giá đủ/chưa đủ**. Ứng dụng dựng câu tổng hợp tương ứng.

Khi phòng xác nhận chưa đủ, báo cáo ghi “Chưa đảm bảo nhân sự phục vụ bay”; nếu có cả quân số thực có và nhu cầu xác nhận, nêu rõ số thiếu. Nếu không có nhu cầu, không tự suy đoán con số thiếu. LƯU NHÁP chưa được coi là dữ liệu đã xác nhận.

## 3. Báo cáo
Tab **BÁO CÁO TGĐ** hiển thị báo cáo 5 phần và bảng 10 tiêu chí; phần đầu có logo SAGS. Nội dung các phòng gửi nhanh có khu vực riêng, dẫn rõ đơn vị. Xem trước, sau đó chọn **XUẤT WORD** hoặc **XUẤT PDF**. Bộ xuất chạy trên trình duyệt và không phụ thuộc tải thư viện Word/PDF qua CDN.

## 4. Xe giao ca
Mỗi đơn vị nhập số người ở các giờ xe, cả hai chiều; bấm **LƯU TẤT CẢ THAY ĐỔI** một lần. Không còn cột **+**. Để thêm giờ mới, dùng **THÊM GIỜ XE KHÁC** và nêu **Lý do thêm xe**. Giờ bổ sung được tô cam, lý do nằm bên dưới cùng màu.

Ở mỗi mốc, hiển thị rõ đơn vị chưa xác nhận. Dấu ~ nghĩa là tổng số người tạm cộng; chỉ gợi ý xe 29/45 chỗ khi đủ 5 đơn vị.

Vào tab **XE GIAO CA** để xem trước, chọn **XUẤT PNG** hoặc **XUẤT PDF**. Cả hai sử dụng logo SAGS tại `assets/logo-sags.png`. Nếu tải không thành công, trạng thái sẽ hiện ngay dưới nút xuất.

## 5. Phạm vi và kiểm thử
Các thư mục/chức năng SAGS FORM LITE, E-Report cũ đã được loại khỏi nhánh chính của repository này. Lịch sử Git vẫn là mốc khôi phục, repo E-Report độc lập không bị xóa. Quy trình GitHub Actions kiểm tra cú pháp cùng các bài thử DOCX/PDF, bảng xe giao ca, quân số trước khi deploy.

Kiểm thử tự động không thay cho xác nhận mở file từ tài khoản thực tế trên iOS/Android/Word/Acrobat.
