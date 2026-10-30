# HDSD BAOCAOMANAGERONDUTY V2.22 — SỬA LỆCH HÀNG/CỘT BẢNG XE

## Nội dung sửa
Phiên bản V2.22 khắc phục giao diện bảng nhập xe giao ca bị lệch hàng/cột, đặc biệt trên màn hình điện thoại. Nguyên nhân là CSS cũ còn quy tắc dành cho 8–10 cột, chồng lên bảng hiện tại có đúng 7 cột và làm độ rộng ô nhập, cột tổng, gợi ý xe không nhất quán.

Bảng nhập được chuẩn hóa đúng 7 cột theo thứ tự:
**GIỜ XE | ĐH | PVHK | PVSĐ | QA & IT | TỔNG | GỢI Ý XE**.

- Áp dụng `<colgroup>` 7 cột, chiều rộng xác định và thống nhất giữa tiêu đề và từng dòng. Phần ghi chú chưa xác nhận/lý do xe thêm tiếp tục dùng `colspan=7`.
- Ô nhập số người có giới hạn kích thước theo ô, căn giữa; không thể đè sang cột đơn vị bên cạnh.
- Trên điện thoại, bảng cho phép **vuốt/cuộn ngang**, có dòng hướng dẫn cuộn ngang và cột **GIỜ XE** luôn cố định khi cuộn.
- Cột **TỔNG** giữ kiểu chữ lớn, đậm; cột **GỢI Ý XE** vẫn có ảnh xe 29/45 chỗ, tổ hợp xe, tổng ghế và ghế dư.
- Thanh **LƯU TẤT CẢ THAY ĐỔI** không còn đè lên các dòng bảng trên điện thoại.

## Quy trình không thay đổi
Các số liệu đã lưu trong cơ sở dữ liệu, 5 giờ xe cố định, các giờ xe bổ sung, quyền sửa/xóa, luồng xác nhận 4 đơn vị, số người và chức năng xuất **PNG/PDF xe giao ca** được giữ nguyên. Sửa đổi là phần HTML/CSS bảng nhập, không thay đổi nghiệp vụ hay công thức tính.

## Cách kiểm tra trên điện thoại
1. Tải lại ứng dụng phiên bản V2.22 rồi mở **CẬP NHẬT → Phòng ĐH/PVHK/PVSĐ → Xe giao ca** theo quyền được cấp.
2. Kiểm tra GIỜ XE luôn trùng hàng với số người và tổng của đúng chuyến xe.
3. Vuốt ngang bảng để xem đủ 7 cột, nhập một ô và xác nhận ô đó không chồng lên ô bên cạnh.
4. Nhập xong cả hai chiều, bấm **LƯU TẤT CẢ THAY ĐỔI** một lần.
5. Kiểm tra lại **BÁO CÁO → Xe giao ca**; xuất PNG/PDF vẫn đủ số người, lý do, xe đề xuất và logo SAGS.

Kiểm thử `tests/v222-shuttle-layout.test.cjs` xác nhận đúng 7 cột, độ rộng cột, tình trạng dữ liệu chưa xác nhận, thanh cuộn, cột giờ cố định và bảo toàn gợi ý xe.
