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


## V1.7 – Tải file Excel và so sánh lịch bay

Trong **LỊCH BAY / EXCEL**, chọn ngày khai thác cùng Dự báo Lần 1 (file đầu ngày chưa bãi) hoặc Lần 2 (file cập nhật buổi tối có bãi). Bấm **File lịch bay**, chọn sheet, hàng tiêu đề, kiểm tra ghép cột **chuyến đến, chuyến đi, STA, STD, bãi**; có thể ghép thêm hãng, loại tàu, đăng bạ, cargo.

**ĐỌC EXCEL & SO SÁNH** hiển thị chuyến mới, thay đổi giờ/bãi, chuyến không còn trong file và giữ nguyên. Dự báo Lần 2 ưu tiên đối chiếu với snapshot Lần 1 đã lưu. Chỉ nhập vào bảng chờ, không tự cập nhật lịch hoặc xóa chuyến. Khi có cặp trùng, tạm chặn lưu để kiểm tra lại file.

Trực ban kiểm tra bảng chờ rồi bấm **LƯU DANH SÁCH ĐÃ DUYỆT** (có xác nhận nếu đụng dữ liệu đã lưu), tiếp theo bấm **XEM RADAR TỰ TẠO**. Radar tự tính 48 khung 30 phút theo STA/STD và thời lượng quy ước từng hãng; nhóm GSE và nhân sự dùng chung với những nguồn đã nhập. Không kết luận khả dụng nếu KTSĐ chưa xác nhận xe/nhân sự. Không gộp tự đoán các dòng chuyến rời và không tự lấy bãi từ lịch khác.

**Lưu ý:** Chưa có file Excel lịch bay CXR thực tế đính kèm ở lượt hiện tại, nên phải kiểm tra ghép cột và bảng chờ trước khi cập nhật dữ liệu nghiệp vụ.


## V1.8 – TỰ NHẬP EXCEL SAGS VÀ LẬP RADAR
**Chỉ dành cho tài khoản ĐH hoặc ADMIN.**
1. Vào **LỊCH BAY / EXCEL** và chọn đúng file lịch bay SAGS có sheet **LB** (ví dụ `LICH BAY SAGS 29OCT26 (1).xlsx`). Không cần chọn cột hoặc bấm lưu thủ công.
2. Hệ thống đọc ngày tại ô **A2** (29/10/2026 trong file mẫu), nhận diện **ARRIVAL FLIGHT** và **DEPARTURE FLIGHT** thành hai danh sách riêng. Không ghép theo cùng dòng; ưu tiên ghép đăng bạ + thứ tự thời gian, sau đó ghép theo hãng, chặng đảo chiều, giờ nếu cả hai bên có một ứng viên duy nhất. Những ghép không có đăng bạ được đánh dấu **chờ đối chiếu**.
3. Tự động gọi giao dịch Supabase `ops_import_sags_schedule`. Nếu file có lỗi hoặc giao dịch thất bại, dữ liệu cũ không bị ghi dở dang. Bảng `ops_schedule_uploads` lưu lịch sử nguồn; `ops_forecast_snapshots` giữ ảnh chụp Lần 1/Lần 2 bất biến; nhập lại đúng file (SHA-256) không nhân đôi bản ghi.
4. Tự ghi số chuyến đến/đi, giờ STA/STD, đăng bạ, loại tàu, chặng và số khách có nguồn; giá trị TBA giữ là chưa có dữ liệu. Bãi đỗ chưa có trong sheet LB nên **bản tự động luôn là Dự báo Lần 1**, không suy đoán bãi.
5. Sau khi nhập thành công, hệ thống chuyển sang **RADAR 30 PHÚT** và tự tính khung cao điểm, gồm các chuyến qua 00:00 có ký hiệu `+`. Chuyến đi không có chuyến đến vẫn giữ là **chưa ghép**, không cộng như một cặp đến–đi tự tạo.
6. Lịch **Lần 2 sau 21h** nếu có mẫu Excel cấu trúc khác hoặc có bãi đỗ sẽ vào luồng so sánh hiện có; cần kiểm tra cấu trúc mẫu Lần 2 trước khi tự động hóa tương tự. Mọi sự khác biệt được lưu kèm lịch sử, không xóa snapshot Lần 1.
7. Radar chỉ đưa ra nhu cầu nhân lực, SKYONE, PVHK và GSE theo dữ liệu đã có; không tự coi nhân sự hoặc thiết bị là đã xác nhận khi đơn vị chưa cập nhật.

**Lưu ý dữ liệu mẫu:** File 29/10/2026 có 34 chuyến đến và 36 chuyến đi, sheet LB; Sheet2 có nội dung khác cấu trúc nên không được tự cộng vào lịch LB.


## V1.9 – TRANG CHỦ THEO ĐƠN VỊ & XUẤT WORD DỰ BÁO LẦN 1 TỰ ĐỘNG

- **ĐH/ADMIN**: Trang Tổng quan 4 bước (Excel lịch bay, Radar tự tính, Báo cáo Lần 1, cập nhật bãi Lần 2). Nút **XUẤT DỰ BÁO LẦN 1 (.DOCX)** tải ngay file Word, không cần gõ lại 9 nhận định mỗi ngày.
- **KTSĐ**: Chỉ hiển thị 2 ca SÁNG/ĐÊM với bốc xếp, lái xe GSE, khung SKYONE bổ sung, và đường dẫn đến GSE khả dụng. Có thể để trống khi chưa xác nhận.
- **PVHK**: Chỉ hiển thị 2 ca đội ĐẾN/đội ĐI; khung giờ riêng thêm khi phát sinh. Không phải mở các bảng vận hành đơn vị khác.
- **VIEWER**: Xem Radar/bản tin, không ghi dữ liệu. Sử dụng chung tài khoản RNS và phân quyền Radar hiện có.
- **Ngày mặc định**: D+1 theo giờ Việt Nam; vẫn chỉnh được ngày.
- **Mẫu Word**: Giữ 5 mục theo tài liệu người dùng ngày 30/10: I. Tóm tắt khai thác; II. Bảng kiểm soát 9 mục; III. Cảnh báo cao điểm 30 phút; IV. Phối hợp thực hiện; V. Kiến nghị Ban TGĐ. File chỉ kèm liên kết trực tuyến cho phân tích Radar sâu, không nhét toàn bộ biểu đồ vào Word.
- **Nguồn dữ liệu**: Ưu tiên ảnh chụp dự báo Lần 1 đã lưu riêng, không sử dụng lẫn lịch Lần 2 có bãi. So sánh ngày D khi có số liệu. Chỉ kết luận về cargo, thời tiết, GSE khi có nguồn; chưa có thì ghi CHƯA XÁC NHẬN.
- **Ghi chú ngoại lệ**: Bên ĐH có 5 ô tùy chọn về AOC, thời tiết, tồn tại ca trước, kiến nghị và ghi chú điều hành; chỉ nhập khi có phát sinh. Lưu trong bảng Supabase ops_report_notes theo ngày.
- **HDSD**: Đăng nhập RNS được cấp quyền → tải Excel nếu chưa có lịch → chọn ngày → bấm XUẤT DỰ BÁO LẦN 1 ở Tổng quan; tài khoản KTSĐ/PVHK chỉ cập nhật phần mình.
- **Kiểm thử**: Kiểm tra cú pháp JS qua GitHub Actions; cần kiểm thử tải DOCX và ghi dữ liệu bằng tài khoản thực tế trước khi nghiệm thu vận hành chính thức.
