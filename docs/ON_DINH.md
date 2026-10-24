# ĐÁNH GIÁ TÍNH ỔN ĐỊNH · SAGS FORM LITE V1.0

**Ngày đánh giá:** 24/10/2026 · **Nguồn đối chiếu:** E-REPORT-SAGS V2.5.47, commit 41ad37fc9033f160fd00c21008ff9711ddfd7294.

## 1. Kết luận mức sẵn sàng

Trạng thái: **BẢN PHÁT TRIỂN / DEMO**, CHƯA nghiệm thu khai thác. Không có cơ sở để công bố "ổn định 100%" hoặc "không lag" do chưa chạy đo trên thiết bị, mạng và quyền Firebase thật.

## 2. Các yếu tố đã thiết kế để giảm lag

- Không tải 6 biểu mẫu ngay lúc khởi động; chỉ khi mở mẫu mới tải Form Registry và trang đang xem.
- 6 biểu mẫu gồm 774 trường trên 9 trang gốc; một màn hình chỉ dựng hotspot thuộc trang đang xem.
- Chuyến bay chỉ `getDocs` một lần khi vào/người dùng chủ động làm mới hoặc đổi ngày; không subscribe toàn bộ danh sách chuyến.
- Chỉ subscribe **một document** A/C LIMITS dùng chung để nhận nội dung AD cập nhật; kiểm tra mốc cảnh báo cục bộ 20 giây/lần, không liên tục ghi dữ liệu.
- Không dùng toàn bộ E-Report (24 MB); loại bỏ AI, scan, báo cáo, heartbeat và các sự kiện không phục vụ nghiệp vụ Lite.
- PDF engine chỉ tải khi xuất; xử lý từng trang, không chụp nguyên giao diện; dữ liệu biểu mẫu có revision chống đè.
- Không ép reload phiên bản khi đang nhập liệu.

## 3. Rủi ro còn tồn tại

| Mức | Vấn đề | Hướng xử lý cần làm trước khi triển khai |
|---|---|---|
| CAO | FIREBASE RULES của E-Report cũ có thể chặn `lite_*`; thay đổi rules có thể ảnh hưởng E-Report | Gộp fragment qua quy trình review, test emulator, không ghi đè rules cũ |
| CAO | A/C LIMITS dùng nguồn chung E-Report và RTDB; giao dịch hai DB không nguyên tử | Bật ghi sau khi test; xử lý thiếu đồng bộ và đặt Firestore làm nguồn xác thực rõ ràng |
| CAO | Hệ điều hành tạm dừng tab/PWA: cảnh báo T-10 chỉ được thực thi khi app đang hoạt động | Server-side scheduler + push nếu cần bảo đảm cảnh báo ở nền |
| CAO | Chức năng SỔ TAY quản trị gốc, chữ ký đặc thù và 208 chưa được hồi quy/đối chiếu đầy đủ | Nghiệm thu từng chức năng bằng bộ case nghiệp vụ của E-Report |
| TRUNG BÌNH | Tài nguyên hình PNG và registry >1MB chưa được đóng gói trong ZIP nếu chưa vendor | Chạy vendor; kiểm tra hash, tải local CDN/Pages |
| TRUNG BÌNH | PDF dựa trên bản mẫu PNG + overlay canvas, chưa đo trên iPhone cấu hình thấp | In thử từng trang và kiểm tra font, căn lề, giới hạn bộ nhớ |
| TRUNG BÌNH | Offline lưu bản nháp `localStorage` không bảo đảm bền khi iOS xóa cache | Thêm IndexedDB cho production, cảnh báo thiếu bộ nhớ, xuất bản nháp |
| TRUNG BÌNH | Xung đột sửa form chỉ xử lý bằng revision/hiển thị lỗi, chưa có giao diện hợp nhất | Cho người dùng chọn so sánh khác biệt trước khi tải bản mới |
| THẤP | Link CDN Firebase/PDF-Lib cần mạng | Vendor bản đã rà soát và CSP rõ ràng khi production |

## 4. Mục tiêu kiểm thử (chưa đo)

- Trên iPhone đời thấp, Android trung bình và desktop: trang danh sách < 2 giây sau khi xác thực trong điều kiện mạng ổn định.
- Chuyển trang biểu mẫu đã tải < 0,5 giây; p95 nhấp hotspot < 150 ms; memory peak PDF < 150 MB.
- Nhận chuyến đồng thời 2 máy: đúng một máy ghi thành công; máy còn lại báo đã nhận.
- Hai thiết bị sửa cùng mẫu: máy lưu sau nhận lỗi xung đột, không mất bản nháp.
- Đúng 10 phút trước STA / ETD / STD: popup tương ứng; sau PUSHBACK không cảnh báo; không thông báo trùng; cùng event có sửa mới phải dùng revision mới nhất.
- PDF được kiểm tra đối chiếu từng trường cho tất cả 9 trang, đúng khổ và không lỗi dấu tiếng Việt.
- SỔ TAY đủ 28 hãng và nội dung đầy đủ; kiểm tra quản trị/Excel import theo bản gốc.

## 5. Bộ kiểm thử được cung cấp

`npm test` (logic thuần), `npm run check` (syntax JS). Không thay thế kiểm thử tích hợp Firebase Security Rules / quyền người dùng và thử trực tiếp trên iOS.

## 6. Quyết định khuyến nghị

**Chưa thay thế E-Report đang sử dụng.** Chạy Lite trên URL riêng và cơ sở dữ liệu test / nhánh kiểm thử, nghiệm thu Firebase Rules, 6 biểu mẫu, SỔ TAY và LIMITS; chỉ đưa vào khai thác khi không còn lỗi mức CAO.

## 7. Kiểm tra bảo mật nguồn cũ

Đối chiếu Firestore Rules hiện tại ở E-REPORT-SAGS cho thấy `match /sags_handovers/{document=**}` cho phép **activeUser đọc/tạo/sửa**; nghĩa là giao diện AD-only của Lite không tự bảo đảm cơ chế phân quyền ghi A/C LIMITS ở phía máy chủ. Để bảo đảm "chỉ AD sửa LIMITS", phải gia cố backend rules với điều kiện bảo toàn quyền nghiệp vụ E-Report cũ. Không được xem `enableLegacyLimitsWrites` là chốt bảo mật; đây chỉ là cờ phòng ngừa thao tác từ giao diện Lite.


## Kiểm tra V1.3 (24/10/2026)

- **26/26** unit/integration-mock logic test đạt. Bao gồm sáu form, 9 trang, tọa độ và tỷ lệ nền ảnh gốc, chữ ký giữ tỷ lệ, chữ ký lỗi phải chặn xuất.
- Kiểm thử trực quan Chrome/Playwright trong môi trường biên dịch bị chặn bởi policy ERR_BLOCKED_BY_ADMINISTRATOR; **không xem là đã nghiệm thu trình duyệt**.
- Workflow GitHub Pages phải kiểm tra SHA đầy đủ của tài nguyên mẫu E-Report gốc trước khi upload bản phát hành.
- Chưa đo tốc độ tạo PDF / PDF UI thực tế trên iOS Safari/Android/PC và chưa đối chiếu bản in 9 trang; giữ trạng thái phát triển/kiểm duyệt.
- Cảnh báo Firebase Rules: không thay đổi rules khi phát hành PDF preview.