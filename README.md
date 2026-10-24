# SAGS FORM LITE V1.7 – KẾ THỪA DỮ LIỆU E-REPORT

**Không tạo dữ liệu mới:** Auth / users của E-Report; toàn bộ RTDB dùng prefix `sags_live_v470` như hàm `sagsV470Ref` bản cũ. Dữ liệu `roster_mail` cho nhân viên, `roster_manifests` cho AD, `flight_records` gốc khi AD bấm xem. Không tạo `lite_flights`, không ghi thêm hồ sơ, không ghi vào roster hoặc form.

## Sửa lỗi V1.7

- Sửa nguyên nhân RTDB permission denied từ V1.6: thiếu prefix bắt buộc `sags_live_v470` ở các đường dẫn phân công và hồ sơ chuyến.
- Đồng bộ tiền tố cho RTDB A/C LIMITS (tính năng ghi vẫn khóa); không sửa Rules hoặc tài khoản.
- Tăng phiên bản/cache-busting toàn bộ chuỗi import JS; thêm bài kiểm thử cho nhánh dữ liệu gốc.

## Sửa lỗi V1.6

- Sửa alias `FSAGS` của E-Report = mẫu 42.3, kèm các mã mẫu có tiền tố `F/SAGS-CXR/`.
- Không tự bỏ cả chuyến chỉ vì nhiệm vụ mang mã ngoài sáu biểu mẫu. Nhiệm vụ khác chỉ hiển thị nhãn nghiệp vụ gốc và không cho nhập trực tiếp.
- Dùng đúng manifest cha `roster_manifests/{date}` cho AD, hộp thư `roster_mail/{username}/items` có query `opDate` cho cá nhân.
- Bổ sung chẩn đoán số lượng bản ghi theo ngày/nhóm; nút chọn hôm qua/hôm nay, phân biệt không có phân công với không có hồ sơ chuyến.
- AD có thể đọc (chỉ khi bấm) danh mục hồ sơ gốc `flight_records/{date}`, chỉ hiển thị nhãn và metadata, không tải/sao chép dữ liệu biểu mẫu ra kho mới.
- Dùng cache-busting V1.6 cho các module JS đã thay đổi.

## Giới hạn cần hiểu

V1.6 vẫn là bản chuyển tiếp. Hộp phân công không đồng nghĩa toàn bộ hồ sơ chuyến. Chỉ người có quyền RTDB phù hợp mới đọc được bản ghi. Không có truy cập tài khoản thật để xác minh quyền dữ liệu đã phát sinh ở Firebase. Nhận chuyến, sửa form và PDF có dữ liệu phải tiếp tục mở workflow E-Report gốc.

Không có quy trình tạo dữ liệu mới, không triển khai Firestore Rules riêng. Việc nhập nghiệp vụ thật trực tiếp trong giao diện Lite chưa hoàn thiện và không được tuyên bố đã xong.

Xem thêm `docs/HDSD_V1.6.md` và `docs/KIEN_TRUC_KE_THUA_V1.5.md`.

Xem hướng dẫn V1.7: `docs/HDSD_V1.7.md`.