# HDSD BAOCAOMANAGERONDUTY V2.21 — GỢI Ý TỔ HỢP XE GIAO CA

## 1. Tính toán gợi ý khi trên 45 người
Từ V2.21, phần **Xe giao ca → Gợi ý xe** không còn dừng tại cảnh báo chung “CẦN BỔ SUNG XE”. Hệ thống sử dụng đúng hai loại xe **29 chỗ (29C)** và **45 chỗ (45C)** để tính tổ hợp **theo từng giờ xe và từng dòng xe**.

Nguyên tắc chọn phương án:
1. **Tất cả số người phải có ghế**.
2. **Ưu tiên số xe ít nhất** đủ sức chở.
3. Trong các tổ hợp có cùng số xe, **ưu tiên số ghế dư ít nhất**.
4. Nếu vẫn hòa, ưu tiên nhiều xe 45 chỗ hơn để thuận tiện điều phối.

| Người đã được xác nhận | Phương án gợi ý | Tổng ghế | Ghế dư |
|---:|---|---:|---:|
| 0 | Không cần xe | 0 | 0 |
| 1–29 | 1×29C | 29 | Tùy tổng |
| 30–45 | 1×45C | 45 | Tùy tổng |
| 46–58 | 2×29C | 58 | 0–12 |
| 59–74 | 1×45C + 1×29C | 74 | 0–15 |
| 75–90 | 2×45C | 90 | 0–15 |
| 91–103 | 1×45C + 2×29C | 103 | 0–12 |
| 104–119 | 2×45C + 1×29C | 119 | 0–15 |
| 120–135 | 3×45C | 135 | 0–15 |

Các mức lớn hơn tiếp tục được tính tự động; ví dụ 136 người chọn **2 xe 45C + 2 xe 29C = 148 ghế, dư 12**.

## 2. Bảng nhập và bảng xe xuất PNG/PDF
- **Bảng nhập** hiển thị số xe 45C/29C kèm đúng hình xe, tổng số ghế và số ghế dư theo gợi ý.
- **Bản xem trước / ảnh PNG / PDF** sử dụng **cùng một hàm tính gợi ý**, không có tình trạng màn hình hiển thị một phương án còn ảnh xuất một phương án khác.
- Chỉ đưa ra gợi ý khi đủ **4/4 đơn vị xác nhận**: ĐH, PVHK, PVSĐ, QA & IT. Ô số 0 đã lưu được tính là xác nhận; ô trống không được xem là 0.
- Các giờ xe cố định và các xe thêm giữ nguyên quy trình nhập, ghi lý do, lưu một lần và quyền xóa của ĐH/ADMIN.

## 3. Cảnh báo giới hạn
Gợi ý chỉ dựa trên **sức chứa danh nghĩa 29C/45C**, **chưa tự kiểm tra số lượng xe vật lý sẵn sàng**, lịch chạy, xe dự phòng, tài xế, thời gian quay đầu hoặc khả năng điều xe. ĐH cần xác nhận khả dụng thực tế và có thể chọn phương án khác phù hợp. Không tự tạo thêm giờ xe hoặc tự điều xe khi số người vượt 45.

## 4. Kiểm thử
Bài kiểm thử `tests/v221-shuttle-planner.test.cjs` kiểm tra các mốc biên 0/29/30/45/46/58/59/74/75/90/91/103/104/119/120/135/136 và đồng bộ với bảng xe xuất PNG/PDF. Workflow GitHub Pages phải hoàn tất bước kiểm thử trước khi phát hành.
