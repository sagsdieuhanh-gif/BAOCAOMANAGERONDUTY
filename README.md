# SAGS FORM LITE · V1.1 · 24/10/2026

Ứng dụng độc lập, tối giản của Phòng Điều hành, lấy ý tưởng và Form Registry từ **E-REPORT-SAGS** commit `41ad37fc9033f160fd00c21008ff9711ddfd7294` / V2.5.47.

## Phạm vi

- **6 mẫu gốc:** 42.1, 42.3, 55.1, 54, 94, 208. Form Registry chứa 774 trường trên 9 trang, kèm tọa độ trường. Chỉ tải registry khi nhân viên mở biểu mẫu đầu tiên.
- **Nhận chuyến / hồ sơ chung:** `lite_flights/{date_arrival_departure}` và `lite_flights/{id}/forms/{formId}`; mỗi chuyến chỉ được tạo một lần; nhận chuyến và lưu revision bằng transaction chống ghi đè.
- **SỔ TAY:** tra cứu bộ dữ liệu 28 hãng từ E-Report; chỉ tải khi vào SỔ TAY, lưu cache của trình duyệt, hỗ trợ tra cứu/tóm tắt và AD quản lý bản nháp dữ liệu. Dữ liệu gốc **không bị ghi đè**.
- **A/C LIMITS:** đọc đúng danh mục đang dùng `sags_handovers/AC_LIMITS_CATALOG_V1`; bao gồm REG/FLIGHT/BOTH, ngày hiệu lực, T-10 theo STA/ETD/STD, ASU, nhóm cảnh báo, phân vai, thông báo tuần tự, thay thế nội dung mới, chặn trùng. Mặc định khóa quyền ghi chung để kiểm tra Firestore/RTDB trước khi bật.
- **PDF:** dựng từ hình mẫu gốc và overlay dữ liệu trên từng trang (lazy-load PDF-Lib lúc xuất), không chụp nguyên giao diện; browser canvas hỗ trợ chữ Việt; biểu mẫu 208 xuất A4 ngang.

## Khởi chạy

Cần Node.js 20+ và trình duyệt cập nhật. Script vendor xác minh **size và Git blob SHA-1** của từng tài nguyên trước khi lưu; không dùng asset sai phiên bản. Chạy:

```sh
npm run test
npm run check
npm run vendor  # CẦN KẾT NỐI INTERNET, tải 6 mẫu và sổ tay nguyên bản tại commit đã chốt
npm start
```

Mở `http://localhost:8080/?demo=1` để kiểm tra giao diện với dữ liệu mẫu **HOÀN TOÀN CỤC BỘ**, chọn `admin_demo`, `dh_demo` hoặc `viewer_demo`. Không nhập mật khẩu thật. DEMO không ghi dữ liệu vào Firebase. Không dùng dữ liệu DEMO cho khai thác thực tế.

Ứng dụng bình thường tại `http://localhost:8080/` dùng Firebase của E-Report trong `config.js`. Tài khoản phải tồn tại trong Firebase Authentication và được AD cấp role trong `lite_users/{uid}`.

## Phân quyền / Firestore Rules

**Tuyệt đối không triển khai tập tin `firebase/lite-firestore-fragment.rules` độc lập để ghi đè Firestore Rules hiện tại của E-Report.** Đây chỉ là đoạn rules cần gộp/thẩm định với rules hiện có; nếu ghi đè có thể phá quyền của E-Report cũ.

Vai trò `AD` quản lý account, chuyến, tất cả biểu mẫu. `DH` tạo/nhận chuyến và sửa chuyến được nhận. `CBTT` / `VIEWER` xem biểu mẫu; CBTT vẫn nhận cảnh báo LIMITS khi catalog có gán vai trò. **Tài khoản Admin gốc** cần được bootstrap có kiểm soát qua Firebase Console/Admin SDK; không hard-code mật khẩu hoặc cấp ADMIN từ client.

## Lưu ý vận hành A/C LIMITS

- Mặc định `enableLegacyLimitsWrites:false` (config.js), để **đọc** LIMITS từ E-Report mà chưa ghi. Chỉ chuyển `true` sau khi điều chỉnh phân quyền phía backend: nguồn cũ hiện cho phép mọi `activeUser` sửa `sags_handovers`; cờ UI này **không phải** giới hạn bảo mật. Phải đối chiếu rules của `sags_handovers/AC_LIMITS_CATALOG_V1` và `ac_limits/catalog_public` và thử trên môi trường kiểm thử. Bất kỳ thao tác lưu nào cũng ghi **vào danh mục chung** với E-Report, không phải danh mục độc lập.
- Một màn hình app đang mở mới đảm bảo định thời cảnh báo cục bộ; nếu trình duyệt đóng hoặc bị hệ điều hành treo nền, **không thể bảo đảm cảnh báo đúng T-10**. Không dùng app làm nguồn duy nhất của cảnh báo an toàn khai thác; cần bổ sung xử lý server / push trong môi trường thực tế.
- Nếu RTDB từ chối đồng bộ sau khi Firestore đã lưu, giao diện báo lỗi đồng bộ không đầy đủ. AD phải kiểm tra và xử lý, tránh dữ liệu bất nhất.

## SỔ TAY / bảo tồn nghiệp vụ

Gói nguồn gồm **bộ tải và giao diện SỔ TAY mới đọc toàn bộ JSON nguồn**, cùng script `npm run vendor` để mang vào bản phát hành **module nguyên bản `app/modules/carrier-notebook.v1.js`** làm đối chiếu. Tuy nhiên, các tính năng quản trị nâng cao của module cũ (đọc/cập nhật đầy đủ từ mọi cột Excel, điều chỉnh nút trên màn hình, xuất hai file phát hành chính thức) chưa được kiểm chứng tương đương với bản Lite. Bản Lite có quản lý bản nháp JSON, nhập Excel cơ bản và tra cứu đủ dữ liệu; KHÔNG tuyên bố thay thế 100% module quản trị cũ trước khi kiểm thử nghiệp vụ.

## Form / PDF

- Hình mẫu và JSON không nhúng trong ZIP chưa chạy `npm run vendor`; lúc chạy trình duyệt có thể tải qua raw.githubusercontent.com đúng commit pin. Nếu môi trường ngăn mạng ngoài, cần chạy vendor trên máy có mạng rồi triển khai cả thư mục.
- Trường dữ liệu được đưa vào theo đúng tọa độ Form Registry nhưng các biểu mẫu cần được nghiệm thu PDF từng trang/từng ô trên giấy thật. Chữ ký viết tay lưu dạng PNG Data URL theo đúng chuyến và mẫu, không tự lấy từ mẫu khác.
- Chưa cài module nghiệp vụ nâng cao cũ của mẫu 208 hoặc logic đặc thù của các checkbox trong mẫu 54/94. **Cần đối chiếu nghiệp vụ từng mẫu trước khi triển khai chính thức.**

## Kiểm thử / Giới hạn

`npm test` kiểm tra logic nhận diện chuyến, giờ, phân vai, LIMITS, phiên bản bản nháp. Chưa thể chạy kiểm thử tích hợp Firebase thực do thiếu tài khoản có quyền kiểm thử và Firebase Rules được chấp thuận. Chưa thể đo p95 thật trên 4G/iPhone. Đánh giá ổn định được ghi trong `docs/ON_DINH.md`.

## Mô hình triển khai

Tạo **repository riêng** (không ghi đè E-REPORT-SAGS), đưa toàn bộ cây thư mục sau khi vendor, cấu hình GitHub Pages tại repo mới. Dùng HTTPS chính thức và cấp miền mới trong Firebase Authentication > Authorized Domains. Không ép refresh lúc nhân viên đang nhập. Phiên bản mới phải cập nhật `version.json` và HDSD.

## Giao diện V1.1 (24/10/2026)

Giao diện được thiết kế lại hoàn toàn: login hai vùng, header/desktop sidebar, mobile bottom navigation, flight dashboard thống kê, flight card, flight workspace 6 thẻ tài liệu và editor gọn. Không bổ sung thư viện UI hoặc gọi CDN khi mở trang, nhằm giảm chi phí khởi động. Không thay đổi nghiệp vụ SỔ TAY, A/C LIMITS hoặc nội dung Form Registry/PDF gốc. Đây là bản phát triển có Demo Local, **không triển khai Firebase Rules tự động**.

Repo triển khai: https://github.com/sagsdieuhanh-gif/EREPORT . GitHub Pages qua GitHub Actions sẽ cần quyền Pages Settings / nguồn GitHub Actions; nếu bị tắt Pages, quản trị viên bật từ Settings → Pages → Build and deployment → GitHub Actions.