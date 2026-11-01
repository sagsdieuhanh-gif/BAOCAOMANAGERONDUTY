# MANAGER ON DUTY V3.22

## V3.22 – BÁO CÁO GỌN ~2 MẶT A4 VÀ QUY ƯỚC CHARTER ##

- **Nội dung nghiệp vụ Lần 1/Lần 2 giữ theo bộ nhận định chuyên ngành V3.21**: dữ liệu chuyến, khung giờ 30 phút, bãi K1/K2/K3, cargo, quân số theo đội, GSE, trách nhiệm phối hợp. Nội dung đã được ĐH chỉnh thủ công vẫn được ưu tiên; không tự thay đổi dữ liệu gốc.
- **Trình bày trở lại dạng bảng gọn**, không dùng 10 khối riêng cao nhiều trang: các mục trong một bảng gồm **Nội dung | Nhận định trọng tâm | Phương án / Đơn vị thực hiện**; cao điểm và phối hợp cũng dùng bảng 3 cột. Quân số vẫn theo ca sáng/tối; không ẩn đội, booking hoặc thông tin đã xác nhận.
- Xuất PDF tối ưu khổ **A4 dọc**, thu gọn khoảng cách, độ cao biểu đồ và thử mức dàn trang tối ưu hướng đến **khoảng 2 trang** cho lịch bình thường. Không có cơ chế cắt bỏ lời nhận định hoặc dữ liệu chỉ để ép chính xác 2 trang: nếu nguồn có nhiều chuyến đặc thù/ghi chú dài, số trang có thể cao hơn để bảo toàn nội dung và độ đọc được. Word cũng theo A4 dọc với bảng và font gọn.
- **Ký hiệu `##`** ở đầu số hiệu chuyến là dấu nhận diện **CHARTER – chuyến thuê chuyến không thường lệ**. Khi nhập lịch, phần mềm bỏ tiền tố đó khỏi mã chuẩn để ghép cặp nhưng giữ `raw_no` và `charter=true` để nhận biết. Chuyến Charter **phục vụ bình thường theo lịch, đăng bạ, booking và thỏa thuận hiện có**, không được tự xếp là ferry, chuyến cần xác minh, hoặc phát cảnh báo nghiệp vụ chỉ vì `##`.
- Nếu nguồn nghiệp vụ của **một chuyến không phải Charter** xác nhận ferry thì đánh giá ferry độc lập theo trường dữ liệu đó, không suy ra ferry từ `##`. Cũng không mặc định mọi charter đều có yêu cầu đặc biệt; chỉ thực hiện nếu hãng thông báo yêu cầu cụ thể.
- Ví dụ `##QQE530` được nhận diện Charter; không tự hiện cảnh báo `Charter/Ferry chưa thống nhất`, không tự yêu cầu ĐH xác minh loại hình chỉ vì ký hiệu `##`.
- Đã giữ ẩn các chú thích kỹ thuật về nguồn quân số và tên file Excel trong bản trình Ban TGĐ; thông tin nguồn vẫn lưu trong hồ sơ để truy vết. Bộ kiểm thử hồi quy giữ các tình huống Lần 1/Lần 2 của 31/10, 01/11 và 02/11.
