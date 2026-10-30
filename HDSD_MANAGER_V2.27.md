# HDSD BAOCAOMANAGERONDUTY V2.27 — XE GIAO CA CỐ ĐỊNH / THÊM GIỜ KHÁC

## 1. Bảy giờ xe chính cố định

| Chiều | Giờ cố định |
|---|---|
| **NHA → CXR** | **07:00, 17:30, 19:30** |
| **CXR → NHA** | **08:15, 16:30, 18:30, 02:00** |

Đây là **bảy giờ cố định** phải hiển thị sẵn trên bảng nhập của ĐH, PVHK, PVSĐ và QA & IT, cả khi chưa có đơn vị nhập quân số. Không cần bấm thêm giờ cho các mốc này.

**Quy tắc qua ngày:** trong cấu trúc ngày khai thác hiện tại, 02:00 và 08:15 chiều CXR → NHA được biểu diễn **02:00 (+1)** và **08:15 (+1)**, nghĩa là ngày kế tiếp so với ngày khai thác đang chọn. Giờ 16:30 và 18:30 thuộc ngày đang chọn. Cách ghi (+1) được giữ nguyên khi xem trước và xuất PNG/PDF, tránh hiểu nhầm mốc 02:00 là giờ cùng ngày trước đó.

## 2. Mốc khác: người dùng tự thêm

Ngoài bảy giờ chính, tại đúng chiều xe mở mục **“+ THÊM GIỜ XE KHÁC CHO CHIỀU NÀY”** và nhập:
1. Giờ chạy;
2. Đánh dấu **Ngày hôm sau (+1)** nếu là giờ qua ngày;
3. **Lý do thêm xe**, ví dụ phục vụ họp chuyên môn;
4. Bấm **THÊM MỐC GIỜ**.

Giờ mới được hiển thị riêng/đánh dấu nổi bật, có lý do ở bên dưới. Nếu giờ đã có sẵn (cố định hoặc đã thêm), ứng dụng không tự tạo dòng trùng. Nếu muốn thêm **xe thứ hai tại một giờ đã có**, sử dụng chức năng thêm dòng xe cùng giờ, không thêm mốc giờ trùng.

## 3. Nhập quân số, gợi ý, xuất báo cáo

- Đúng bốn đơn vị và thứ tự: **ĐH – PVHK – PVSĐ – QA & IT**.
- Mỗi đơn vị chỉ nhập đúng cột được phân quyền, riêng ĐH/ADMIN được chỉnh nghiệp vụ của tất cả các phòng; không thay đổi quyền quản lý tài khoản.
- Mỗi mốc đều có tổng quân số; chỉ khi cả bốn đơn vị xác nhận mới tự gợi ý tổ hợp xe **29 chỗ / 45 chỗ**, ưu tiên số xe ít nhất, rồi số ghế dư ít nhất.
- Các mốc cố định **không thể bị xóa cả giờ xe**. Các xe/mốc bổ sung được ĐH/ADMIN xóa theo quyền, có xác nhận và nhật ký khi dữ liệu bị ảnh hưởng.
- **PNG/PDF xe giao ca** dùng chung danh sách giờ và công thức tính với bảng nhập; tất cả giờ cố định, giờ thêm, lý do, số người, tổng và gợi ý được giữ đầy đủ.

## 4. Kiểm tra

Kiểm thử `tests/v227-shuttle-seven-fixed.test.cjs` xác nhận bảy mốc cố định, 02:00 (+1), tính nguyên vẹn dữ liệu và các mốc tự thêm. Migration `server/v227-shuttle-fixed-seven.sql` đã cập nhật quy tắc cơ sở dữ liệu để bảo vệ 02:00. Không thay đổi dữ liệu những ngày đã nhập, không tự tạo người đi xe cho mốc mới.
