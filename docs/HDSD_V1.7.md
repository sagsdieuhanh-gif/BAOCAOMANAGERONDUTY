# HƯỚNG DẪN SỬ DỤNG – SAGS FORM LITE V1.7

Ngày cập nhật: 24/10/2026. Kế thừa toàn bộ quy tắc V1.6.

## Sửa lỗi “Realtime Database từ chối đọc hộp phân công”

E-Report gốc truy vấn thông qua `sagsV470Ref` với namespace `sags_live_v470`. V1.6 nhầm đường dẫn, đọc trực tiếp `roster_mail` / `roster_manifests` tại root; Firebase RTDB trả `Permission denied` do dữ liệu và Rules cũ nằm trong namespace gốc. V1.7 dùng đúng namespace.

- Nhân viên: `sags_live_v470/roster_mail/{USERNAME}/items` theo query `opDate == ngày được chọn`.
- AD: `sags_live_v470/roster_manifests/{YYYY-MM-DD}`.
- AD khi bấm XEM HỒ SƠ: `sags_live_v470/flight_records/{YYYY-MM-DD}`.
- Các lệnh đồng bộ RTDB A/C LIMITS (chế độ ghi hiện vẫn khóa) dùng `sags_live_v470/ac_limits/...`.

## Cách kiểm tra

1. Tải lại trang `https://sagsdieuhanh-gif.github.io/EREPORT/` và xác nhận nhãn **V1.7**.
2. Đăng nhập bằng tài khoản E-Report hiện có; không cần tạo tài khoản/mật khẩu mới.
3. Mở **Chuyến bay**, chọn đúng **ngày khai thác** của lịch phân công; kiểm tra các số liệu **NGUỒN DỮ LIỆU**.
4. Nếu danh sách trống nhưng không báo lỗi, thử ngày có phân công khác. Một ngày không có phân công không có nghĩa dữ liệu chuyến bị xóa.
5. Nếu vẫn có lỗi permission denied, phải đối chiếu Rules RTDB hiện hành của chính đường dẫn `sags_live_v470/...`, tình trạng Firebase Auth và đúng tài khoản. Không sửa/nới Rules tự động.

## Quy tắc an toàn

Chỉ thay tiền tố RTDB; không chuyển dữ liệu, không ghi mới, không chỉnh Rules, không sao chép biểu mẫu. Tài khoản, vai trò, phân công, chữ ký, PDF và dữ liệu gốc không đổi. Bản Lite vẫn chưa hỗ trợ thao tác hoàn chỉnh với form/PDF trên dữ liệu cũ; tiếp tục sử dụng E-Report gốc cho tác vụ đó đến khi nối đúng workflow.

## Kiểm thử

Các bài test kiểm tra đường dẫn RTDB trong code, không thay thế E2E đăng nhập bằng tài khoản thật. Kiểm tra nhánh GitHub Pages để bảo đảm bản deploy thực sự V1.7.