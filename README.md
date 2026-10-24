# SAGS FORM LITE V1.8 — ỔN ĐỊNH & KIỂM DUYỆT KẾ THỪA E-REPORT

**Ứng dụng kế thừa, chưa đạt toàn bộ yêu cầu vận hành.** SAGS FORM LITE dùng Firebase Auth, Firestore `users/{UID}` và vùng RTDB `sags_live_v470` gốc, không tạo kho chuyến bay/phân công mới. Mọi thao tác nghiệp vụ chưa nối trực tiếp vẫn dùng E-Report cũ, tránh ghi đè hoặc làm mất dữ liệu.

## Lỗi đã sửa V1.8

- **Đăng nhập/crash:** chuẩn hóa các import JavaScript về **cùng duy nhất** `backend.mjs?v=1.8.0` / `firebase.mjs?v=1.8.0`. V1.7 nạp 2 singleton dẫn đến lỗi `Cannot read properties of null (reading 'f')` khi A/C LIMITS khởi động.
- **Lỗi SỔ TAY:** kiểm tra hai tệp dữ liệu cùng script; nếu asset Lite bị lỗi, thử tải phiên bản module gốc từ GitHub Pages E-Report, xác minh Git SHA1 blob trước khi thực thi, chỉ đổi 2 đường dẫn data sang nguồn gốc. Khi thất bại, hiển thị lỗi rõ và nút vào ứng dụng gốc. Không tạo danh mục mới.
- Nếu watcher A/C LIMITS lỗi trong lúc đăng nhập, dashboard vẫn hoạt động; lỗi sẽ hiển thị riêng.

## Trạng thái phạm vi nghiệp vụ

- Đăng nhập: cùng hệ thống cũ, cần E2E Firebase thực tế.
- Phân công, nhận chuyến: mới hiển thị danh sách phân công, **chưa nhận/chuyển việc trên Lite**.
- 6 biểu mẫu: có tài nguyên registry gốc cho demo, **chưa đọc/ghi dữ liệu form gốc**.
- Xem trước PDF: đã có bộ PDF mô phỏng từ form gốc, **chưa tích hợp dữ liệu biểu mẫu production**.
- SỔ TAY: nạp module nguyên bản, thêm khả năng khôi phục tải.
- A/C LIMITS: đọc danh mục; quản trị và popup nghiệp vụ chuẩn vẫn dùng E-Report cũ.

**Không đưa Demo vào vận hành.** Không có bản Lite nào được xác nhận tương đương toàn bộ E-Report cũ. Xem `docs/KIEM_DUYET_V1.8.md` và `docs/HDSD_V1.8.md` để phân biệt các hạng mục đạt/chưa đạt.

## Kiểm thử cục bộ

`npm test && npm run check` — 42 bài kiểm thử mã nguồn/quy tắc; KHÔNG thay thế thử nghiệm tài khoản dữ liệu thật hoặc PDF in thực tế.

## Nguồn gốc

- E-Report: `https://github.com/sagsdieuhanh-gif/E-REPORT-SAGS` commit `41ad37fc9033f160fd00c21008ff9711ddfd7294`.
- Lite: `https://github.com/sagsdieuhanh-gif/EREPORT`.