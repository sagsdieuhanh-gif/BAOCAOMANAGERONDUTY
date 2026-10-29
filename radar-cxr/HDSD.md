# SAGS-CXR RADAR & DỰ BÁO – V1.5

Địa chỉ: https://sagsdieuhanh-gif.github.io/EREPORT/radar-cxr/

## Mục tiêu
Ứng dụng Radar và dự báo SAGS-CXR được xuất bản độc lập tại thư mục `radar-cxr/` trên GitHub Pages. Không sửa nghiệp vụ SAGS FORM LITE/E-Report hiện hành. Sử dụng Supabase Auth và hệ thống dữ liệu ops_* đã tạo trước đó.

## Quy trình
1. **Dự báo Lần 1**: nhận Excel lịch bay D+1 đầu ngày (chưa có vị trí đỗ). Phân tích sản lượng, khung giờ cao điểm, quốc nội/quốc tế, nhân sự; không suy đoán bãi.
2. **Dự báo Lần 2**: sau khoảng 21 giờ nhận lịch bay có bãi đỗ D+1. Cập nhật Radar theo khu vực bãi, GSE và ảnh hưởng đường công vụ. Giữ ảnh chụp dữ liệu Lần 1 trong ops_forecast_snapshots.
3. **Đầu vào nhân sự**: KTSĐ nhập bốc xếp/lái xe theo ca; bốc xếp thuê ngoài SKYONE theo khung giờ tùy chọn, cộng vào số bốc xếp. PVHK nhập đội chuyến đến và đội chuyến đi; hai ca mặc định 08:15–18:15, 18:15–08:15 ngày hôm sau, có thể thêm khung giờ.
4. **Door Close**: theo dõi chênh lệch >15 phút so với STD hoặc ETD nếu có; báo cáo D+1 lấy Door Close ngày D, đánh dấu nguyên nhân chưa xác minh để ĐH kiểm tra.

## Lưu ý
- Danh mục GSE và tương thích A330 là dữ liệu thiết bị; **không mặc định xe khả dụng** khi chưa được KTSĐ xác nhận.
- Phân quyền nằm ở Supabase Postgres RLS, không phụ thuộc khả năng truy cập tệp HTML.
- GitHub Pages là website tĩnh công khai; không lưu mật khẩu hoặc service-role key trong repo. Publishable key Supabase trong HTML là khóa dành cho trình duyệt, còn RLS mới quyết định quyền đọc/ghi.
- **Chưa nghiệm thu E2E đăng nhập tài khoản ADMIN**; cần tạo/cấp quyền đúng trong Supabase Auth trước khi dùng thực tế.
- **Nhập ảnh lịch bay** hiện chỉ là OCR hỗ trợ; không tự tin cậy hóa dữ liệu bảng chưa kiểm tra.


## V1.6 – DÙNG CHUNG TÀI KHOẢN RNS

- **Không đăng ký tài khoản mới:** Radar và RNS dùng chung dự án Supabase Authentication. Dùng đúng email/mật khẩu hiện có của RNS để đăng nhập Radar. Do website Radar và RNS có tên miền khác nhau, người dùng vẫn cần đăng nhập ở cả hai nơi; không tự động chia sẻ phiên đăng nhập.
- **Không tự phát sinh quyền:** Mặc định tài khoản RNS chưa được vào Radar. ADMIN Radar mở **PHÂN QUYỀN**, nhập đúng email RNS, chọn ĐIỀU HÀNH/KTSĐ/PVHK/CHỈ XEM và bấm **CẤP / CẬP NHẬT QUYỀN RADAR**.
- **Xem danh sách/thu hồi:** ADMIN bấm **XEM TÀI KHOẢN ĐÃ CẤP** rồi **KHÓA QUYỀN RADAR** để gỡ quyền ứng dụng Radar. Tài khoản và quyền RNS giữ nguyên.
- **Phân quyền nghiêm ngặt:** VIEWER chỉ xem; DH cập nhật lịch bay, Door Close, nhận định và phát hành; KTSĐ cập nhật GSE, bốc xếp, lái xe, SKYONE; PVHK cập nhật đội đến/đi. Chỉ ADMIN phân quyền, tài khoản không thể tự cấp hoặc nâng quyền. Không cấp ADMIN mới tại form thông thường.
- **Giới hạn:** Người có email RNS nhưng không cùng Supabase Auth hoặc không nằm trong auth.users chưa thể cấp bằng email; cần kiểm tra tài khoản đang dùng hệ thống xác thực nào. Chưa thử nghiệm E2E bằng mật khẩu của nhân viên thật.
