# KIỂM DUYỆT SAGS FORM LITE V1.9

Nguồn gốc: `sagsdieuhanh-gif/E-REPORT-SAGS` commit `41ad37fc9033f160fd00c21008ff9711ddfd7294` (cố định). Đích: `sagsdieuhanh-gif/EREPORT` GitHub Pages.

## Phạm vi 4 nhóm nghiệp vụ

| Nhóm | Trạng thái hiện tại | Cơ chế / giới hạn |
|---|---|---|
| Phân công, nhận việc, chuyển giao | Có thể thao tác trên module gốc được nhúng | Gọi `flightWorkspaceOpenList`, giữ `roster_mail`, `roster_manifests`, `roster_sessions`, không tạo dữ liệu mới; chưa E2E đăng nhập thật |
| Nhập, lưu 6 biểu mẫu | Có thể mở nhiệm vụ bằng `assignmentId`, `flightId`, `date` để thao tác trong gốc | Gọi `sagsV478OpenExactAssignment`. 54/94/208 dùng toàn bộ hàm nguồn. Chưa kiểm định form theo từng vai trò; không làm mới form renderer |
| Xem trước / xuất PDF | Sử dụng trực tiếp nút PDF gốc trong khung | Giữ nền, tọa độ, chữ ký, số trang do app gốc; cần kiểm in 9 trang trong môi trường thật |
| A/C LIMITS | Có thể vào module quản trị gốc trong khung | `aclSimpleOpen` (fallback `aclOpenAdmin`) xử lý quyền CRUD, tín hiệu, popup; muốn nhận cảnh báo gốc liên tục phải giữ phiên gốc đang mở |

## Kiến trúc

- `scripts/build-native.mjs` sao chép các tài nguyên **nguyên bản** từ upstream Git checkout pinned SHA vào `_site/native`, chỉ bỏ đoạn redirect tự động GitHub Pages→Vercel (bắt buộc cho cùng-origin và không truyền thông tin xác thực).
- `src/native-workspace.mjs` điều phối UI và gọi đúng API trong iframe, xác minh same-origin và **UID Firebase Auth trùng nhau** trước khi bấm hành động từ Lite.
- Code gốc vẫn độc lập, toàn bộ dữ liệu ở Firebase gốc. Lite không giữ mật khẩu hay token từ ứng dụng gốc.
- Bản chính Lite vẫn tải nhẹ; native app (24 MB tài nguyên gốc trước nén) tải **chỉ khi người dùng mở Nghiệp vụ/A-C LIMITS**.
- Không chạm repo E-Report gốc, Firebase Rules hay quyền tài khoản.

## Chưa được coi là hoàn thành

- Chưa xác nhận Chrome/Safari iOS/Android có thể thực thi đầy đủ app gốc bên trong iframe trên Pages.
- Chưa kiểm tra trạng thái đăng nhập chung và chính sách quản lý quyền với tài khoản thật, đặc biệt quyền AD bootstrap.
- Chưa kiểm tra PDF ký tay 54/94/208 và quy trình nhiều người làm việc đồng thời.
- Không phải giao diện nhập liệu mới thuần native Lite; hiện vẫn sử dụng UI E-Report nguyên bản bên trong khung khi vận hành.
- Cảnh báo A/C LIMITS khi không mở native app chỉ là lớp phụ trợ có phạm vi hẹp, chưa tương đương cảnh báo toàn đơn vị từ app gốc.