# FIREBASE ACCESS V1.4 – Bổ sung Rules SAGS FORM LITE không phá E-Report cũ

## Chẩn đoán mã nguồn

- Cấu hình Firebase Lite trỏ cùng project `e-report-sags` với E-Report gốc.
- `users/{UID}` là hồ sơ tài khoản dùng chung; nguồn E-Report có `allow read: if signedIn() && (request.auth.uid == uid || isAdmin())`.
- Kể từ V1.2, Lite đọc hồ sơ tại `users/{UID}` (không còn `lite_users/{UID}`).
- Sau bước đọc hồ sơ, ứng dụng truy vấn `lite_flights` theo ngày. Repository E-Report gốc ở commit tham chiếu **không có match /lite_flights** trong `firebase/firestore.rules`.
- Khi rules deployed không cho phép `lite_flights`, Firestore trả `permission-denied`; trước V1.4 lỗi bị gộp thành lỗi đọc tài khoản.
- Những thông tin này dựa trên source trong GitHub; rules **đang deployed thực tế** phải được kiểm tra trực tiếp trong Firebase Console trước khi kết luận tuyệt đối.

## Cách cấp quyền chuẩn

1. Mở Firebase Console → project `e-report-sags` → Firestore Database → Rules.
2. Sao lưu phiên bản rules đang áp dụng và kiểm tra không có thay đổi khác đang chờ phát hành.
3. Tích hợp **nội dung** file `firebase/lite-firestore-fragment.rules` trong repo Lite **vào bên trong** `service cloud.firestore { match /databases/{database}/documents { ... } }` của bộ rules E-Report đang áp dụng. Cụ thể: đặt các hàm `liteSignedIn`, `liteProfile`, `liteEnabled`, `liteRole`, `liteAD`, `liteDH`, `liteCanEdit`, `liteFormId` trong `match /databases/{database}/documents`, và đặt `match /lite_flights/{id}` cùng cấp với `match /users/{uid}`. File fragment **không phải rules hoàn chỉnh**; tuyệt đối KHÔNG triển khai trực tiếp một mình.
4. Đọc từng câu `allow` trước khi Publish. Không sửa `match /users`, `/sags_handovers` hay các collection hiện tại của E-Report để khắc phục lỗi này.
5. Dùng Rules Playground/Emulator kiểm thử: anonymous read bị từ chối; tài khoản active có thể list/read `lite_flights`; DH được tạo/nhận đúng chuyến; nhân viên không phụ trách không ghi được biểu mẫu; VIEWER không ghi; người bị khóa không đọc.
6. Publish Rules sau khi kiểm tra. Reload Lite và bấm **KIỂM TRA LẠI QUYỀN TRUY CẬP**.
7. Không dùng `allow read, write: if true`, không tắt Rules và không sửa Firebase Admin SDK credentials để sửa lỗi giao diện.

## Điều quan trọng về triển khai

GitHub Pages chỉ host HTML/JS và **không tự triển khai Firestore Rules**. Việc push mã nguồn Lite lên `sagsdieuhanh-gif/EREPORT` sẽ **không** mở quyền `lite_flights` trên project Firebase chung. Cần quyền quản trị project Firebase để phát hành rules riêng.

Ngoài việc cấp quyền, chức năng nhập biểu mẫu cần nghiệm thu dữ liệu thực và chữ ký. Quy tắc A/C LIMITS chung hiện tại còn phải được đánh giá riêng trước khi bật quyền sửa từ Lite.