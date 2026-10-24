# KIỂM DUYỆT THỰC TRẠNG SAGS FORM LITE V1.8

Đối chiếu ngày 24/10/2026, dựa vào mã E-Report `E-REPORT-SAGS` commit `41ad37fc9033f160fd00c21008ff9711ddfd7294` và Lite `EREPORT`. Đây là báo cáo kỹ thuật dựa trên mã nguồn/kiểm thử, KHÔNG phải xác nhận đã nghiệm thu Firebase bằng tài khoản thực.

## Các chức năng thuộc phạm vi bắt buộc

| Chức năng | Nguồn nghiệp vụ gốc | Tình trạng V1.8 | Thiếu trước khi được gọi là hoàn thiện |
|---|---|---|---|
| Đăng nhập/phân quyền | Firebase Authentication; Firestore `users/{uid}` | **Đã kết nối mã nguồn**, sửa lỗi nạp trùng SDK; yêu cầu xác nhận đăng nhập thực | Kiểm thử 3 vai trò, session/đổi mật khẩu và domain Auth |
| Phân công, nhận việc | RTDB `sags_live_v470/roster_manifests`, `roster_mail`, `roster_sessions` | **Chỉ xem phân công cũ**; đúng root và lọc theo ngày; không ghi dữ liệu riêng | Nhận việc, chuyển giao, xác nhận, đồng bộ trạng thái từ E-Report |
| Hồ sơ chuyến chung | RTDB `sags_live_v470/flight_records` và workspace | **Đọc tóm tắt AD theo yêu cầu**, cá nhân xem mailbox | Hiển thị dữ liệu chuyến và nhiệm vụ đúng quyền bằng flightId/assignmentId gốc |
| Mẫu 42.1, 42.3, 55.1 | Form registry và session gốc | **Có nền và dựng PDF ở DEMO**, không nối đọc/ghi session thật | Kế thừa xử lý nhập, lưu, tính toán, chữ ký, điều kiện bắt buộc và in mẫu gốc |
| Mẫu 54, 94 | `fsags54-94.v622.js`, `form-registry-runtime.v6419.js` | **Chưa nối trực tiếp nghiệp vụ thật** | Điều kiện nhận mẫu, luồng dữ liệu, chữ ký, PDF chuẩn |
| Mẫu 208 | `fsags208-workspace.v1.js` | **Chưa nối trực tiếp nghiệp vụ thật** | Chính sách phân công, hồ sơ 208, chứng từ và PDF |
| Xem trước/xuất PDF | Form PDF renderer gốc | **Có PDF cơ bản cho DEMO**, chưa xem/in trực tiếp biểu mẫu thật | Nghiệm thu đối chiếu 9 trang, chữ ký và dữ liệu đã lưu gốc |
| SỔ TAY | `carrier-notebook.v1.js`, `carrier-service-guide.json` | **Nạp nguyên module gốc**, sửa tải lỗi, kiểm tra tài nguyên và fallback phiên bản đã kiểm chứng | Kiểm thử thực tế data/Excel/AD/iOS và các nguồn phụ thuộc |
| A/C LIMITS | Firestore `sags_handovers/AC_LIMITS_CATALOG_V1`; RTDB catalog và tín hiệu | **Đọc danh mục**, khóa chức năng ghi; cảnh báo vận hành Lite chưa hoạt động đầy đủ | Thực thi đúng mốc STA−10, ETD/STD−10, popup và tác vụ AD như bản gốc |

## Hai lỗi V1.7 được sửa trong V1.8

1. **`Cannot read properties of null (reading 'f')`**: `src/app.mjs` và `src/limits.mjs` import hai URL khác nhau của `backend.mjs`. Trình duyệt tạo hai singleton `api` và hai module `firebase.mjs` riêng; Firebase khởi tạo ở một bản nhưng LIMITS sử dụng bản khác. V1.8 ép mọi import cùng phiên bản URL và không để lỗi LIMITS chặn dashboard.
2. **Không tải được SỔ TAY**: loader trước chỉ thử một script URL, chưa kiểm tra hai file dữ liệu và không `await` open. V1.8 thử nạp bản Lite sau khi kiểm tra tài nguyên; khi lỗi mới tải source gốc từ E-Report, kiểm tra SHA1 Git blob đúng pin, đổi *chỉ* hai URL dữ liệu sang E-Report gốc, rồi mới thực thi. Nếu cả hai nguồn lỗi, hiển thị lỗi chi tiết và link gốc; không tự thay thế bằng dữ liệu giả.

## Quy tắc triển khai các bản sau

- Không tạo `lite_flights`, `lite_users`, biểu mẫu/assignment thứ hai.
- Không thay đổi Firebase Rules hoặc repository E-Report gốc chỉ để né lỗi.
- Tập trung tích hợp đúng module gốc bằng adapter/đúng metadata, chỉ tải khi dùng.
- Khi chưa kiểm thử đủ không mô tả các chức năng là đã hoàn tất nghiệp vụ.
- Phân biệt kiểm thử tự động với nghiệm thu dữ liệu thật, thiết bị thật, nghiệp vụ thật.
- Mỗi bản cần đồng bộ `version.json`, HDSD và module cache keys.