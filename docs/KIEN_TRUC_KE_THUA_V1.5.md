# NGUỒN CHÂN LÝ NGHIỆP VỤ SAGS FORM LITE

Nguồn E-Report gốc (không chỉnh sửa): `sagsdieuhanh-gif/E-REPORT-SAGS` commit `41ad37fc9033f160fd00c21008ff9711ddfd7294`.

| Chức năng | Tài nguyên E-Report gốc | Trạng thái Lite V1.5 |
|---|---|---|
| Đăng nhập / quyền / đổi mật khẩu | Firebase Auth; Firestore `users/{UID}`; `app/boot/06-legacy.js` | Dùng chung Auth và users; giữ điều kiện đổi mật khẩu |
| Phân công và nhận việc | RTDB `roster_manifests`, `roster_mail`, `roster_sessions`, `flight_records`; `app/modules/daily-roster.v502.js`, `app/modules/roster-lite.v5.js`, `app/modules/self-accept.v502.js` | Đọc phân công gốc vào dashboard; thao tác nhận/điều chuyển ở app gốc |
| 42.1 / 42.3 / 55.1 | E-Report form registry + workflow session gốc; `app/modules/form-registry-runtime.v6419.js` | Chưa kết nối chỉnh sửa vào session gốc; thao tác ở E-Report |
| 54 / 94 | `app/modules/fsags54-94.v622.js`, `app/modules/form-registry-runtime.v6419.js` | Chưa kết nối trực tiếp; thao tác và PDF ở E-Report |
| 208 | `app/modules/fsags208-workspace.v1.js`, `app/boot/08-v412-kh208-script.js` | Chưa kết nối trực tiếp; thao tác và PDF ở E-Report |
| SỔ TAY | `app/modules/carrier-notebook.v1.js`, `data/carrier-service-guide.json`, `data/carrier-guide-version.json` | Tải/chạy nguyên bản ngay trong Lite; không viết lại |
| A/C LIMITS | `app/core/phases/core-tools.js`; Firestore `sags_handovers/AC_LIMITS_CATALOG_V1`; RTDB `ac_limits/...` | Tra cứu chung tại Lite; quản trị và popup nghiệp vụ gốc vẫn dùng E-Report |

**Ràng buộc cứng:** không tạo `lite_users`, `lite_flights`, kho biểu mẫu Lite hoặc cơ chế phân công mới. Không sao chép quyền, chữ ký, dữ liệu biểu mẫu giữa hai kho. Các module chỉ tối ưu UI và cách tải; không thay logic nghiệp vụ gốc.

**Chưa nghiệm thu:** việc ghép session E-Report vào khung nhập mới, tự mở đúng task và nền tảng cảnh báo độc lập của Lite. Không được mô tả V1.5 là bản thay thế vận hành hoàn toàn.