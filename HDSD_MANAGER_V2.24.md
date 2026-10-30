# HƯỚNG DẪN V2.24 — NHẬP NHÂN SỰ GỌN, RÕ NGUỒN

## Giao diện nhập nhân sự chính
Vào **CẬP NHẬT** → **ĐH**, **PVHK** hoặc **PVSĐ** tùy quyền. Mục **TỔNG QUÂN SỐ PHỤC VỤ BAY** được đưa lên đầu khu vực báo cáo của phòng và chỉ hiển thị **02 ca**:
- **Ca sáng**: Quân số hiện có; quân số cần (nếu có định mức); đánh giá của phòng: *Chưa đánh giá / ĐỦ nhân sự / THIẾU nhân sự*.
- **Ca đêm**: ba trường tương tự.
- Bên dưới mỗi ca, chương trình nêu nhận định ngắn **thiếu bao nhiêu / dư bao nhiêu theo số đã nhập**. Nếu thiếu thông tin, ghi chưa có cơ sở kết luận. Nếu tự chọn *ĐỦ* nhưng nhu cầu lớn hơn số hiện có, sẽ nhắc kiểm tra và chặn xác nhận cho đến khi đánh giá thống nhất.
- **0 người** là một con số có thật; **ô trống** là chưa xác nhận. Không tự chuyển ô trống thành 0.
- Phía dưới có **NỘI DUNG SẼ ĐƯA VÀO BÁO CÁO**, hiển thị thử câu tổng hợp theo từng phòng.

## Thao tác lưu
- **XÁC NHẬN & LƯU THÔNG TIN PHÒNG** là nút chính. Với ĐH/PVHK/PVSĐ, phải nhập quân số và tình trạng của cả hai ca để xác nhận chính thức.
- Nếu chưa đủ số liệu, mở **Chưa đủ dữ liệu? Lưu nháp**. Dữ liệu nháp được lưu riêng trạng thái **DRAFT**, **không được coi là nguồn nhân sự đã xác nhận** của báo cáo điều hành.
- Nếu cần ghi nội dung khác, mở **THÔNG TIN NGHIỆP VỤ BỔ SUNG**. Nếu cần dán nguyên nhiều dòng, mở **DÁN NHANH BẢN TIN CỦA PHÒNG**; nội dung dán nhanh vẫn có nút lưu riêng và được giữ tại nguồn tin của phòng, không nhập đè dữ liệu quân số.
- Với Kho Hàng và QA & IT, màn hình chính không yêu cầu nhập hai ca không có trong nghiệp vụ: phần thông tin nghiệp vụ **mở sẵn** để dùng ngay.

## Hai loại dữ liệu nhân sự — không được cộng trùng
1. **Tổng quân số xác nhận** tại form chính, lưu ở `ops_unit_forecasts`: dùng ghi nhận đủ/thiếu theo ca của từng phòng trong báo cáo.
2. **Phân bổ theo đội và giờ** trong mục mở rộng (PVHK đến/đi, PVSĐ bốc xếp/lái xe, SKYONE, nhân sự tăng cường), lưu tại `ops_staff_capacity`: dùng tính khả năng phục vụ đồng thời từng chuyến và điều phối cao điểm. Đây là cách **phân chia** người từ quân số/nguồn lực, không mặc định là người bổ sung cộng vào tổng ca.

Vì mục đích khác nhau, phần phân bổ chuyên biệt tiếp tục có nút **LƯU PHÂN BỔ ĐỘI** riêng. Hệ thống không tự ghi đè tổng quân số bằng phép cộng đội đến/đi hoặc SKYONE. Người quản lý phải đối chiếu trước khi ra nhận định đủ/thiếu.

## Báo cáo và dữ liệu cũ
- Không thay đổi cấu trúc bảng, dữ liệu đã xác nhận, quyền nhập/phân quyền hay mẫu xuất Word/PDF.
- Nhận xét tình hình phục vụ Lần 2 vẫn sử dụng quân số đã xác nhận cùng định mức quầy hãng, bãi, gate, booking, cargo và GSE theo tình hình của ngày.
- Dữ liệu nháp không tự biến thành dữ liệu đã xác nhận, các số liệu đã nhập trong phân bổ đội không bị xóa khi thu gọn giao diện.

## Kiểm thử
Bản V2.24 có kiểm thử cho 02 ca, 03 trường/ca, nút xác nhận duy nhất ở bề mặt chính, mở rộng nháp/dán nhanh/đội chuyên môn, số 0 và trường trống, cảnh báo đánh giá mâu thuẫn và bảo toàn dữ liệu báo cáo.
