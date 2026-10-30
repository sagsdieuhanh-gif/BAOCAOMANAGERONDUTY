# HƯỚNG DẪN BAOCAOMANAGERONDUTY V2.20

## Mục tiêu giao diện
Ứng dụng giữ nguyên toàn bộ dữ liệu, quyền và nghiệp vụ của bản trước. Thay vì một dải nhiều tab nhỏ và khó đọc, trang sau đăng nhập được gom thành **04 nhóm chính**, mỗi công việc chỉ xuất hiện một lần:
1. **TỔNG QUAN** – theo dõi nhanh sản lượng, công việc, trạng thái từng đơn vị. Các thẻ KPI bị lặp với bảng tổng quan đã được ẩn; bảng so sánh ngày được chuyển thành **XEM THÊM · SO SÁNH SẢN LƯỢNG** để mở khi cần.
2. **CẬP NHẬT** – chỉ hiển thị thường trực 03 công việc: **Lịch bay/Excel**, **PVHK**, **PVSĐ**. Các chức năng chuyên biệt như GSE, quân số, Kho Hàng, QA & IT, Door Close và phân quyền được đưa vào **NÂNG CAO**, không xóa đi. Phân quyền chỉ xuất hiện với tài khoản ADMIN.
3. **PHÂN TÍCH** – Peak Hours và Radar theo khung 30 phút trong một cửa truy cập, phân biệt 4 nhóm lượt chuyến theo giờ và cặp chuyến đang phục vụ.
4. **BÁO CÁO** – các đầu ra duy nhất: báo cáo điều hành (Word/PDF, Lần 1/2), xe giao ca (PNG/PDF), bản tin nhanh, báo cáo Radar. Không có nút xuất Word V2.7 lặp ở trang chủ; muốn xem hoặc xuất báo cáo, dùng chung mục **BÁO CÁO**.

Chọn nhóm trước, sau đó chọn công việc. Các tác vụ vẫn sử dụng đúng biểu mẫu, dữ liệu, quyền lưu và quy trình đã thiết lập. Giao diện tối ưu điện thoại, màn hình máy tính và cảm ứng.

## Thương hiệu
Tại nơi có logo SAGS (đầu ứng dụng, báo cáo điều hành, bản tin Radar và bảng xe giao ca), hiển thị:
**CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH**.

## Xe giao ca và hình ảnh
- Sử dụng đúng **hai ảnh do người dùng cung cấp**: xe **45 chỗ** (màu trắng), xe **29 chỗ** (màu kem) dưới dạng thumbnail WebP để tải nhanh. Thay ảnh mang tính minh họa trước đó bằng thumbnail của chính ảnh gốc.
- Ở phần nhập, hai loại xe được nhận diện bằng ảnh tương ứng trong **GỢI Ý XE**.
- Khi xem trước và xuất **PNG/PDF**, hai ảnh cùng hiển thị ở khu vực gợi ý, có biểu tượng cạnh mốc đã đủ 4 đơn vị xác nhận. Các trường hợp quá 45 người vẫn thể hiện **CẦN BỔ SUNG XE**, không tự chốt phương án xe.
- Giữ nguyên 5 mốc xe cố định: NHA→CXR 07:00 và 17:30; CXR→NHA 16:30, 18:30, 08:15 (+1). Mốc khác phải tự thêm, ghi lý do.
- Bốn đơn vị đúng thứ tự: **ĐH – PVHK – PVSĐ – QA & IT**, Kho Hàng không cộng vào xe.
- Tổng số người to/đậm; đủ/chưa đủ xác nhận, giờ xe thêm, lý do, quyền xóa ĐH/ADMIN và gợi ý 29/45 chỗ tiếp tục hoạt động như trước.

## Xuất đầy đủ, không cắt dữ liệu
**BÁO CÁO → Báo cáo điều hành**: Word/PDF vẫn lấy đúng snapshot đã lưu. Lần 2 có phân tích/số liệu so sánh với Lần 1, Peak Hours, bãi đỗ, gate, booking, ferry, quân số và trang thiết bị; các ô chưa xác nhận vẫn ghi rõ. Phần thu gọn trên giao diện KHÔNG tác động đến HTML và luồng sinh tài liệu.

**BÁO CÁO → Xe giao ca**: PNG và PDF được dựng từ chung một canvas dữ liệu; chứa logo, tên công ty, ngày khai thác, cả hai chiều xe, mốc giờ, quân số từng đơn vị, tổng, trạng thái xác nhận, gợi ý xe bằng ảnh và lý do xe bổ sung.

**BÁO CÁO → Báo cáo Radar**: giữ nguyên module báo cáo cao điểm riêng, không xóa khi hợp nhất thanh điều hướng.

## Kiểm thử
CI chạy lại toàn bộ kiểm thử V2.16–V2.19 và kiểm thử giao diện V2.20 để xác nhận **04 nhóm, các điểm truy cập không trùng, quyền ADMIN, cả hai ảnh WebP, tên công ty và các module Word/PDF/PNG** còn nguyên. Phát hành khi kiểm thử đạt. Trình duyệt thực tế và dữ liệu tài khoản ĐH/PVHK/PVSĐ vẫn cần nghiệm thu riêng trước sử dụng chính thức.
