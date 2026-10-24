# HƯỚNG DẪN SAGS FORM LITE V1.5 – KẾ THỪA E-REPORT GỐC

**Đây là bản chuyển tiếp, ưu tiên không tạo dữ liệu nghiệp vụ mới.** Không thể tuyên bố đã nhúng toàn bộ 6 biểu mẫu và các popup LIMITS hoạt động độc lập trong UI mới.

1. **Đăng nhập** bằng username và mật khẩu Firebase Auth E-Report. Hồ sơ đọc từ `users/{UID}`.
2. **CHUYẾN BAY**: chọn ngày. Lite đọc RTDB gốc: nhân viên đọc `roster_mail/{username}/items` theo `opDate`; AD đọc `roster_manifests/{date}/items`. Các nhiệm vụ thuộc sáu biểu mẫu được nhóm theo `flightId` gốc. Không tạo / nhận chuyến hoặc lưu bản chép vào `lite_flights`.
3. **MỞ NHIỆM VỤ GỐC**: mở E-Report gốc ở tab khác. Tại đó nhận việc, nhập liệu, ký, xuất PDF đúng luồng đã sử dụng. Lite chưa tự định vị vào đúng assignment của tab gốc; người dùng chọn nhiệm vụ trong giao diện E-Report. Tính năng chuyển trực tiếp được bổ sung chỉ sau khi chốt được adapter chính xác và thử nghiệm đầy đủ.
4. **SỔ TAY**: mở module gốc `app/modules/carrier-notebook.v1.js` tại commit gốc. Dữ liệu `carrier-service-guide.json` và `carrier-guide-version.json` được giữ nguyên. Chức năng tra cứu, nhập Excel, quản lý và xuất hai file là mã nguồn nguyên bản. Module chỉ tải khi mở trang.
5. **A/C LIMITS**: Lite đọc danh mục gốc để tra cứu. Nghiệp vụ AD và cảnh báo popup T-10 vẫn chạy ở E-Report gốc; Lite chưa tự bảo đảm cảnh báo T-10 khi mở một mình. Không bật ghi LIMITS từ Lite.
6. **PHÂN QUYỀN**: nguồn duy nhất là `users/{UID}`. Không dùng `lite_users`.
7. **DỮ LIỆU CŨ**: nếu đã có dữ liệu trong `lite_flights` từ bản thử trước, V1.5 không đọc/ghi hay xóa chúng. Không tự động di chuyển hoặc trộn vào hồ sơ gốc.

## Điều kiện nghiệm thu để chuyển sang bản Lite nhập liệu trực tiếp

- Adapter nhận đúng `rosterAssignmentId`, `flightId`, `formGroup`, `workspaceKey`, `roster_sessions`, trạng thái nhận/chuyển/hoàn tất; không tạo ID hay bản ghi mới.
- Các biểu mẫu 42.1, 42.3, 55.1, 54, 94, 208 phải sử dụng bộ xử lý **gốc** và có thể đọc/ghi/trả PDF đúng vào session gốc, không tạo `lite_flights/{id}/forms`.
- A/C LIMITS phải tái sử dụng bộ đọc/sửa, đồng bộ Firestore + RTDB, popup theo mốc và quyền gốc; chạy QA thật theo chuyến.
- Kiểm thử đồng thời Lite ↔ E-Report trên tài khoản được cấp quyền, không đụng database/rules đang khai thác khi chưa xác minh trên môi trường thử nghiệm.