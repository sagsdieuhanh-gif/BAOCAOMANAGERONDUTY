# HDSD V3.26 — Phân quyền hai ứng dụng và xóa tài khoản an toàn

## Nguyên tắc

- **Một tài khoản đăng nhập Supabase Authentication** (email/mật khẩu) dùng chung cho SAGSCXR-RNS và Báo cáo khai thác ngày / MANAGER ON DUTY.
- **Hai bộ quyền độc lập**: `public.sags_docs_members` cấp quyền RNS (ADMIN/EDITOR/VIEWER, active), `public.ops_members` cấp quyền Báo cáo (ADMIN/DH/KTS/PVHK/KHO/QA/IT/VIEWER, active).
- Không tạo thêm tài khoản mới chỉ vì nhân viên dùng thêm một ứng dụng. Dùng **PHÂN QUYỀN 2 ỨNG DỤNG** đối với email đã có.
- Quyền thao tác ADMIN của RNS hoặc Manager không tự động cho phép vào ứng dụng còn lại. Các thao tác sửa **đồng thời hai bộ quyền** và **xóa tài khoản chung** yêu cầu người thao tác có ADMIN ở cả hai.
- Tài khoản ADMIN hiện tại được bảo vệ; không thể xóa hoặc tự thay đổi quyền trong giao diện này.

## 1. Tạo / gửi mời tài khoản mới

1. Đăng nhập vào Báo cáo khai thác ngày bằng ADMIN, mở **QUẢN LÝ TÀI KHOẢN**.
2. Nhập email, họ tên.
3. Tích chọn độc lập **CẤP QUYỀN BÁO CÁO KHAI THÁC NGÀY** và/hoặc **CẤP QUYỀN RNS**; **phải chọn ít nhất một ứng dụng**.
4. Chỉ chọn vai trò/đơn vị cho những ứng dụng đã tích.
5. Xác nhận đúng email. Bấm **TẠO TÀI KHOẢN & CẤP QUYỀN NGAY**, hoặc sử dụng phần thư mời tùy chọn.
6. Mật khẩu tạm chỉ hiển thị một lần; chuyển riêng cho nhân viên. Nhân viên phải thay mật khẩu tại trang xác thực chung của RNS trước khi dùng ứng dụng đã cấp.

Không tự động cho phép cả hai ứng dụng khi chỉ chọn một.

## 2. Cấp hoặc thu hồi quyền cho tài khoản đã có

1. Tìm theo email hoặc họ tên tại **DANH SÁCH TÀI KHOẢN RNS DÙNG CHUNG**.
2. Bấm **PHÂN QUYỀN 2 ỨNG DỤNG** ở đúng nhân viên.
3. Tích/bỏ tích hai quyền riêng và chọn vai trò khi quyền đó bật.
4. Bấm **LƯU PHÂN QUYỀN**, xem nội dung xác nhận rồi đồng ý.
5. Nếu cần khóa quyền **cả hai** nhưng giữ tài khoản và lịch sử, chọn **THU HỒI CẢ HAI QUYỀN**.

Khi bỏ quyền RNS, người dùng không được truy cập văn bản, tệp đính kèm và READ & SIGN; khi bỏ quyền Báo cáo, không được sử dụng dữ liệu báo cáo khai thác. Đổi quyền không đổi email/mật khẩu.

## 3. XÓA TÀI KHOẢN

1. Tìm đúng nhân viên, chọn **XÓA TÀI KHOẢN**.
2. Đọc cảnh báo, nhập **đầy đủ email chính xác**.
3. Xác nhận lần cuối. Backend kiểm tra quyền ADMIN ở cả hai dự án và đối chiếu các ràng buộc dữ liệu nghiệp vụ.
4. **Không có dữ liệu nghiệp vụ liên quan**: xóa người dùng Supabase Auth; các bộ quyền thành viên được loại bỏ theo khóa ngoại.
5. **Có dữ liệu lịch sử**: từ chối xóa vĩnh viễn để giữ nguyên báo cáo, READ & SIGN, dấu vết xác nhận và kiểm toán. ADMIN có thể đồng ý **thu hồi cả hai quyền** thay thế.

Tài khoản ADMIN và chính tài khoản đang thực hiện thao tác không thể bị xóa. Không có chức năng xóa đồng loạt.

## 4. Phân quyền và bảo mật máy chủ

- RNS kiểm tra `sags_docs_members.active` tại các API, RLS và chức năng liên quan.
- Báo cáo kiểm tra `ops_members.active` và `ops_internal.my_unit()` tại RLS.
- Edge Function `sagscxr-radar-register` xử lý `set_app_access`, `delete_account`, `create`, `invite` với xác thực JWT và ADMIN.
- Hàm `public.sags_shared_account_delete_blockers(uuid)` chỉ cho `service_role` thực thi. Hàm đếm tham chiếu tới `auth.users` ở các bảng nghiệp vụ để chặn xóa nguy hiểm.
- Không lưu mật khẩu vào bảng nghiệp vụ, không tự động xóa dữ liệu báo cáo/READ & SIGN và không tự thay đổi quyền hiện hữu trong lần cập nhật.

## 5. Kiểm tra sau phát hành

- Đăng nhập ADMIN, tải lại trang, kiểm tra V3.26.
- Kiểm tra màn hình có 2 lựa chọn độc lập; thử xem danh sách quyền của một tài khoản đang có (không cần lưu).
- Không nên xóa tài khoản thật để kiểm thử. Kiểm tra hành vi xóa tài khoản đã sử dụng bằng hàm kiểm tra lịch sử không ghi dữ liệu.
- Nếu giao diện cũ: tải lại trang hoàn toàn/xóa bộ nhớ đệm.
