# HDSD V2.25 — PHÂN QUYỀN CHI TIẾT MANAGER ON DUTY

## 1. Ma trận vai trò

| Nhiệm vụ | ADMIN | ĐH | PVSĐ (KTS) | PVHK | Kho Hàng | QA / IT | VIEWER |
|---|---|---|---|---|---|---|---|
| Nhập lịch bay Lần 1/Lần 2, sửa dữ liệu lịch | Có | Có | Ẩn | Ẩn | Ẩn | Ẩn | Ẩn |
| Xem Radar/Peak Hours | Có | Có | Có | Có | Có | Có | Có |
| Xem trước báo cáo điều hành, Radar, xe giao ca | Có | Có | Có | Có | Có | Có | Có |
| Chỉnh sửa nhận định báo cáo, phát hành | Có | Có | Không | Không | Không | Không | Không |
| Xuất Word/PDF báo cáo, xuất PNG/PDF xe giao ca | Có | Có | Không | Không | Không | Không | Không |
| Nhập quân số, ghi chú và tình trạng **đúng đơn vị** | Có tất cả | Có tất cả | PVSĐ | PVHK | Kho Hàng | QA/IT chung | Không |
| Nhập số người lên xe giao ca | Có tất cả | Có tất cả | Chỉ cột PVSĐ | Chỉ cột PVHK | Không (không có cột) | Chỉ cột QA/IT | Không |
| Nhập định mức quầy check-in | Có | Có | Không | Có | Không | Không | Không |
| Nhập GSE khả dụng, xe hỏng, bốc xếp, lái xe, SKYONE | Có | Có | Có | Không | Không | Không | Không |
| Nhập booking/đội PVHK đến/đi, quân số PVHK | Có | Có | Không | Có | Không | Không | Không |
| Nhập kế hoạch hàng hóa, thời điểm bàn giao cargo | Có | Có | Không | Không | Có | Không | Không |
| Quản lý/cấp tài khoản và sửa phân quyền | **Có** | **Không** | Không | Không | Không | Không | Không |

**ĐH có quyền quản lý tất cả công việc nghiệp vụ như ADMIN, trừ các chức năng quản lý tài khoản và thay đổi phân quyền.**

## 2. Giao diện theo quyền
- Mỗi tài khoản đăng nhập được nhận diện qua quyền đã lưu trong **ops_members**, không dùng một biến lựa chọn vai trò cho người dùng tự thay.
- Thanh điều hướng chỉ hiển thị các nhóm có ít nhất một chức năng được phép dùng; trong nhóm CẬP NHẬT chỉ hiện phòng tương ứng của tài khoản.
- Các tab và nút trái quyền **bị ẩn hoàn toàn**, không chỉ khóa/đổi màu.
- Trong nhóm BÁO CÁO, tài khoản phòng chỉ thấy bản xem trước và nút tải lại số liệu; không có ô nhận định cho phép sửa, nút phát hành, nút tải Word/PDF/PNG.
- ĐH xem đủ các đơn vị, có thể điều chỉnh đúng phần nghiệp vụ của bất kỳ phòng nào; không xuất hiện tab ADMIN.
- ADMIN được dùng toàn bộ nghiệp vụ và quản lý tài khoản.

## 3. Cơ sở dữ liệu
Quyền được áp dụng đồng thời trên giao diện và tại PostgreSQL **RLS**. Migration `server/v225-room-permissions.sql` điều chỉnh:
- `ops_gse_capacity`, `ops_gse_issues`: chỉ KTS/PVSĐ, ĐH, ADMIN được ghi.
- `ops_warehouse_cargo_plan`: chỉ Kho Hàng, ĐH, ADMIN được ghi.
- `ops_staff_capacity`: từng đơn vị chỉ sửa dòng mang mã đơn vị mình; ĐH/ADMIN được sửa tất cả.
- `ops_unit_forecasts`, `ops_unit_quick_reports`: từng phòng chỉ ghi của phòng mình; QA và IT dùng chung QA_IT; ĐH/ADMIN có quyền nghiệp vụ trên tất cả.
- `ops_shift_transport_v2`: từng phòng chỉ ghi cột của mình; ĐH/ADMIN có quyền trên cả bốn cột.
- `ops_flights`, `ops_forecast_snapshots`, `ops_controls`, `ops_report_notes` và RPC nhập lịch: vốn đã giới hạn ĐH/ADMIN, tiếp tục giữ nguyên.
- `ops_members` và các RPC cấp quyền/tắt tài khoản: vẫn chỉ ADMIN; **không đưa ĐH vào quyền tài khoản**.

Mọi thay đổi chính sách giữ nguyên dữ liệu đã lưu và các chính sách SELECT dành cho tài khoản đang hoạt động. Không dùng cơ chế ẩn nút để thay thế RLS.

## 4. Quy trình của PVSĐ
PVSĐ vào **CẬP NHẬT → Phòng PVSĐ** để ghi tình hình nhân sự ca, bốc xếp, lái xe GSE, SKYONE, xe hỏng/bảo trì, số phương tiện sẵn sàng và số người đi xe ở cột PVSĐ. Mở **BÁO CÁO** chỉ để xem thông tin tổng hợp. Những chức năng nhập lịch bay, sửa báo cáo và xuất file không hiển thị.

PVHK, Kho Hàng, QA/IT làm tương tự với nội dung thuộc phòng mình. Không cần đăng nhập bằng ADMIN để nhập dữ liệu của phòng.

## 5. Nghiệm thu
Kiểm thử `tests/v225-role-permissions.test.cjs` xác nhận ma trận phòng, quyền xem báo cáo, hạn chế xuất file, quyền điều hành của ĐH và quyền tài khoản riêng của ADMIN. Hệ thống vẫn cần nghiệm thu bằng tài khoản thực tế từng phòng trên điện thoại; các nội dung đã lưu và định dạng xuất Word/PDF/PNG không thay đổi.
