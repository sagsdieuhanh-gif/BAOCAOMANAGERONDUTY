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

## V2.0 – 3 phòng ban, một nơi nhập số liệu, XE GIAO CA trong từng tab

**Với tài khoản RNS đã được ADMIN cấp quyền Radar:**
- PVSĐ (mã quyền nội bộ KTS): chỉ mở tab **PVSĐ**, gồm bốc xếp công ty/lái xe GSE theo hai ca 08:15–18:15 và 18:15–08:15, SKYONE theo khung giờ, nhật ký xe hỏng/đang sửa/phục hồi/ảnh hưởng/xe thay thế và khu vực GSE khả dụng (nâng cao).
- PVHK: chỉ mở tab **PVHK**, gồm đội PVHK ĐẾN/đội PVHK ĐI theo hai ca và khung ngoài ca; không phải nhập lần hai ở tab Nhân sự cũ.
- KHO HÀNG: chỉ mở tab **KHO HÀNG**, có kế hoạch theo chuyến (KG, PCS, giờ kho sẵn sàng, ghi chú) và **dán nhanh nhiều chuyến**. Dữ liệu không có không được tự tạo.
- **Xe giao ca** đặt ngay trong mỗi tab PVSĐ, PVHK, KHO HÀNG, KHÔNG có tab XE riêng. 4 mốc chuẩn dùng để tổng hợp: xe về **16:30 / 18:45**, xe đi **17:30 / 19:30**. Mỗi phòng chỉ nhập người thuộc phòng mình. Dữ liệu xe được lưu riêng, kèm tài khoản xác nhận và ngày/giờ xác nhận; TAB ĐH/Radar/Báo cáo chỉ xem số cộng và trạng thái các phòng.
- **Thời điểm xác nhận quân số** theo ca cũng được hiển thị từ confirmed_at của dữ liệu nghiệp vụ, không dùng giờ người dùng tự nhập.
- Phòng Điều hành chỉ nhập Excel dự báo, ghi chú ngoại lệ và phát hành bản tin; không sửa dữ liệu PVSĐ/PVHK/Kho Hàng. ADMIN được quản lý toàn bộ đơn vị.
- **Radar và Báo cáo**: tất cả các vai trò đã được cấp quyền (PVSĐ/PVHK/KHO/ĐH/VIEWER) đều đọc được, không sửa thông tin nghiệp vụ đơn vị khác. Quyền này do RLS Supabase áp dụng đối với nhân sự, GSE, cargo, thiết bị và xe giao ca; ẩn tab UI chỉ là lớp hỗ trợ.
- **Nhận định TBĐH**: 9 mục ngắn, tập trung dữ liệu thật: nhóm chuyến/khoảng 30 phút chồng lấn, cặp ground-time ngắn, cargo theo STD/giờ sẵn sàng, số KG kế hoạch xác nhận, thiết bị hư hỏng ảnh hưởng nào, phương án xe thay thế/điều phối, quân số và xe giao ca. Không tự kết luận khối lượng, số xe sẵn sàng, mức độ đủ người khi thiếu dữ liệu. Cảnh báo thiếu thông tin phải ghi "CHƯA XÁC NHẬN".
- **Bản Word Lần 1** vẫn xuất một chạm, đủ 5 phần của mẫu, bảng rõ ràng, tông xanh hàng không, tiêu đề chuyên nghiệp. Link Radar trực tuyến ở cuối Word; biểu đồ chi tiết không nhét vào văn bản.
- Các tab dài kiểu NHÂN SỰ, GSE, CÔNG CỤ CHI TIẾT vẫn có cấu trúc kỹ thuật để không làm hỏng chương trình cũ nhưng không còn trong menu nghiệp vụ; bảng GSE khả dụng được chuyển vào mục nâng cao của tab PVSĐ.


## V2.1 – XE GIAO CA THEO ẢNH MẪU & XUẤT FILE TẬP TRUNG TẠI BÁO CÁO

**Hai chiều xe rõ ràng:**
- **NHA → CXR (đi làm):** 06:30, 07:00, 09:00, 17:30, 19:30.
- **CXR → NHA (xe về):** 08:15, 09:00, 16:30, 18:45, 01:00 ngày hôm sau (+1).
- Mốc 09:00 CXR → NHA của ảnh gốc có chú thích "ĐH họp chuyên môn", ghi chú này được giữ. **Không lấy con số nhân sự trong ảnh mẫu làm mặc định cho các ngày khác.**

**Nhập liệu:** Xe giao ca KHÔNG có tab riêng; phần nhập số người nằm **ngay trong ba tab PVSĐ, PVHK, KHO HÀNG**, mỗi phòng chỉ ghi được số người phòng mình. Có lựa chọn **+ THÊM KHUNG GIỜ / CHIỀU XE TÙY CHỌN**: tự chọn hai chiều NHA→CXR / CXR→NHA, giờ chạy, cùng ngày hoặc ngày hôm sau (+1), số người và ghi chú. Có thể cập nhật và xóa chuyến bổ sung. Nhập 0 có nghĩa đã xác nhận không có người, ô trống là chưa xác nhận. Mốc nhân sự không đổi không cập nhật lại thời gian xác nhận; thời gian xác nhận mới do máy chủ Supabase ghi.

**Xem và phát hành:** Người dùng mọi đơn vị được cấp quyền đều **xem tab RADAR và BÁO CÁO**, bao gồm bảng xe giao ca tổng hợp. Không còn nút xuất PNG/PDF ở tab nghiệp vụ hoặc RADAR. Chỉ trong **tab BÁO CÁO**, tài khoản **ĐH hoặc ADMIN** được bấm **XUẤT ẢNH PNG XE GIAO CA / XUẤT PDF XE GIAO CA** và **XUẤT DỰ BÁO LẦN 1 (DOCX)**. Các phòng khác chỉ cập nhật nguồn và xem; không có nút xuất. Điều này là phân tách luồng nghiệp vụ tại giao diện; tệp hiển thị và dữ liệu đã được xem vẫn có thể được người có quyền xem lưu thủ công bằng công cụ trình duyệt.

**File xe giao ca:** Xuất tổng hợp đủ PVSĐ, PVHK, KHO HÀNG theo hai chiều; đủ các mốc gốc và giờ bổ sung, số người từng phòng, giờ xác nhận và tổng mỗi chuyến. Dấu `~` trước tổng có nghĩa chỉ là số tạm tính do chưa đủ ba phòng xác nhận; không tự coi dữ liệu trống là 0. Có biểu mẫu PNG màu sắc và PDF nhiều trang khi cần.

**Cơ sở dữ liệu:** Dùng bảng `ops_shift_transport_v2`, ghi nguồn theo (ngày, phòng, chiều, số phút khởi hành) và phân quyền Supabase RLS. Dữ liệu từ bảng xe bốn mốc cũ được chuyển sang bảng v2 nếu có. HDSD phải được đồng bộ với mỗi cập nhật.


## V2.2 – CHỈ CÓ XE 29C VÀ 45C; ĐH NHẬP XE GIAO CA
- Xe giao ca do bốn đơn vị **ĐH, PVSĐ (mã KTS), PVHK, KHO HÀNG** nhập theo tài khoản của mình. ĐH nhập số người đi/về ngay tại trang **ĐIỀU HÀNH**, không tạo tab XE riêng.
- Supabase `ops_shift_transport_v2` cho phép vai trò ĐH tự ghi số người thuộc đơn vị DH, vẫn không được sửa PVSĐ/PVHK/KHO. ADMIN quản trị toàn bộ. Không tự điền số người từ hình minh họa hoặc ngày trước.
- Mỗi tuyến NHA→CXR hoặc CXR→NHA giữ 5 mốc chuẩn và các giờ tự thêm; thời điểm xác nhận do Supabase ghi; ô trống là chưa xác nhận, nhập 0 là đã xác nhận không có người.
- Bảng trên tab **BÁO CÁO** có ĐH, PVSĐ, PVHK, KHO HÀNG, tổng và loại xe dự kiến. Nếu chưa đủ **4/4** đơn vị thì ghi **~ tổng tạm tính** và **CHỜ CHỐT**, không gợi ý loại xe.
- Chỉ có **29 chỗ** và **45 chỗ**, không tồn tại xe vừa. Với tổng người đã chốt: 1–29 => **gợi ý xe 29C**; 30–45 => **gợi ý xe 45C**; trên 45 => **cảnh báo CẦN THÊM XE**, không tự phát sinh loại xe lớn hơn 45C hay suy đoán số xe thực tế; 0 => không có người, không gợi ý điều xe.
- PNG/PDF dùng bố cục báo cáo điều hành hiện đại: bảng cân đối, màu tiết chế, dấu địa điểm Nha Trang/Cam Ranh bằng biểu tượng tối giản, **chỉ hai kích thước icon xe 29C/45C**, số người từng phòng và giờ xác nhận từ dữ liệu thực. Không tạo ảnh bằng số liệu giả để phát hành.
- Chỉ **ĐH/ADMIN** bấm xuất tại tab BÁO CÁO; những tài khoản đã cấp quyền khác được xem dữ liệu chung. Phân tích Radar và các nghiệp vụ hiện có được giữ nguyên.


## V2.3 – ĐỒNG NHẤT ẢNH XEM TRƯỚC VỚI PNG/PDF XE GIAO CA

- Phần ảnh ở **BÁO CÁO** hiện là ảnh dựng trực tiếp từ đúng cùng một renderer Canvas mà nút xuất PNG và PDF sử dụng. Không còn một bảng HTML xem trước nhưng PNG/PDF có bố cục khác.
- Bố cục mới ngang, hai cột **NHA TRANG → CAM RANH (ĐI LÀM)** và **CAM RANH → NHA TRANG (XE VỀ)**; 10 mốc gốc và khung tự chọn xếp theo giờ, mỗi mốc gồm ĐH, PVSĐ, PVHK, KHO HÀNG, giờ xác nhận, tổng và đề xuất loại xe.
- **29C/45C là hai loại xe duy nhất**. Với số người đã xác nhận đủ 4/4: 1–29 người gợi ý 29C, 30–45 người gợi ý 45C, trên 45 người cảnh báo **BỔ SUNG XE**. Không tự chốt số xe hoặc điều xe. Nếu chưa đủ 4/4, không gợi ý xe, ghi tổng tạm tính.
- Biểu tượng Nha Trang sử dụng đường sóng biển đơn giản và Cam Ranh biểu tượng nhà ga/máy bay; phương tiện vẽ với đúng hai tỷ lệ hình xe 29/45. Thiết kế tiết chế, dùng nền trắng, navy, teal.
- **Logo gốc EREPORT:** GitHub Actions copy nguyên file `assets/branding/logo.png` từ repository E-REPORT-SAGS đã checkout tại commit cố định `41ad37fc9033f160fd00c21008ff9711ddfd7294`, xác nhận SHA Git `c5674a77f84b0bd9359d8eed423c074842ecc31a`, đưa vào `_site/radar-cxr/assets/logo-ereport.png` khi phát hành. Không chỉnh sửa hình/logo; cả header web và PNG/PDF sử dụng cùng tệp.
- **PNG:** tải một hình ảnh đúng như ảnh xem trước.
- **PDF:** in raster từ cùng Canvas, mặc định một trang A3 ngang nếu bảng có kích thước chuẩn; nếu số chuyến bổ sung quá lớn, tự chia trang để giữ kích thước chữ. Cả hai nút xuất chỉ nằm trong BÁO CÁO và chỉ ĐH/ADMIN được bấm.
- Nếu logo EREPORT chưa tải thành công, thông báo lỗi rõ ràng thay vì âm thầm thay bằng logo giả hoặc xuất file thiếu nhận diện.


## V2.4 – Một bảng nhập xe giao ca đẹp, phân quyền cột theo đơn vị, QA & IT chung cột

**Các tab:** ĐH, PVSĐ, PVHK, KHO HÀNG và QA / IT đều có một **bảng nhập xe giao ca chung**, đúng hai chiều Nha Trang → Cam Ranh và Cam Ranh → Nha Trang, đủ 10 giờ mẫu và giờ tự bổ sung. Bảng hiện 5 cột **ĐH | PVSĐ | PVHK | KHO HÀNG | QA / IT**. Tài khoản QA và IT được cấp quyền RNS riêng nhưng cùng nhập một cột QA / IT. Các cột không thuộc phòng mình vẫn xem được, nhưng chỉ đọc; ADMIN được quản trị tất cả. Tài khoản VIEWER được xem bảng xuất chung trong BÁO CÁO, không sửa.

**Thao tác:** Nhập số người trực tiếp trong ô dưới đúng mốc giờ. Nhấn **LƯU** ở dòng đó (hoặc Enter) để ghi đúng cột thuộc quyền và giờ máy chủ; không cập nhật lại mốc xác nhận khi dữ liệu không thay đổi. Ô để trống nghĩa là chưa xác nhận, nhập số 0 là xác nhận không có người. Bấm dấu **+** ở ngay cạnh giờ chính để chèn dòng **Bổ sung 1, Bổ sung 2...** ngay dưới cùng mốc giờ, vẫn trong bảng. Dòng mới được tạo tập trung cho mọi phòng cùng thấy. Dòng chính khi có thêm dòng con sẽ hiện **tổng cả khung giờ**. Có vùng **+ THÊM GIỜ XE KHÁC** trong từng chiều, chọn giờ và ngày +1, tạo mốc giờ mới ngay vào bảng.

**Quyền và dữ liệu:** Supabase `ops_shift_transport_v2` thêm `line_no` vào khóa chính để không ghi đè dữ liệu lịch sử; `ops_shift_transport_rows` lưu các dòng bổ sung kể cả khi chưa có phòng nào nhập. Các hàm `ops_add_shuttle_row` và `ops_add_shuttle_slot` xác thực quyền trực tiếp trên máy chủ. RLS của `ops_shift_transport_v2` chỉ cho phép ghi đúng đơn vị, riêng QA và IT đều được sửa hàng có `unit='QA_IT'`; ĐH không sửa số của các phòng khác. Giờ xác nhận máy chủ và người xác nhận được giữ nguyên.

**Tổng và xuất:** Tổng một dòng chỉ được chốt khi đủ **5/5 cột**; nếu thiếu ghi dấu **~** và CHỜ XÁC NHẬN. Đề xuất 29C cho 1–29 người, 45C cho 30–45 người, trên 45 người cảnh báo BỔ SUNG XE (không tự điều xe). Ảnh PNG và PDF được dựng từ đúng cùng bản vẽ xem trước, có cả cột QA / IT và các dòng bổ sung. Chỉ tài khoản ĐH/ADMIN có nút phát hành ở tab BÁO CÁO, các phòng được xem nhưng không tự phát hành.

**Chú ý:** Tài khoản QA/IT hiện có phải được ADMIN gán vai trò QA hoặc IT tại mục Phân quyền Radar (không tạo tài khoản đăng nhập mới). Cần kiểm thử nhập/lưu trên tài khoản thực tế trước khi nghiệm thu chính thức.


## V2.5 – ĐĂNG KÝ, QUẢN LÝ TÀI KHOẢN DÙNG CHUNG VỚI RNS

**Nguồn đăng nhập:** Giữ nguyên **Supabase Authentication chung** của SAGSCXR-RNS và Radar. Không sử dụng username/password Firestore, không lưu mật khẩu trên trang QUẢN LÝ. Người dùng chỉ cần một email và một mật khẩu để đăng nhập hai website, với quyền nghiệp vụ mỗi hệ thống tách riêng.

**Tại QUẢN LÝ TÀI KHOẢN (chỉ ADMIN):**
1. **ĐĂNG KÝ TÀI KHOẢN MỚI:** Nhập email/họ tên/chọn một trong ĐH, PVSĐ, PVHK, KHO HÀNG, QA, IT, VIEWER, bấm **GỬI LỜI MỜI TẠO TÀI KHOẢN RNS**. Một Supabase Edge Function riêng `sagscxr-radar-register` xác thực phiên đăng nhập và kiểm tra ADMIN còn active. Function gửi email mời bằng Supabase Auth đến RNS `/secure.html`, tạo một Auth user, ghi `ops_members` theo quyền Radar và cấp RNS role `viewer` tối thiểu trong `sags_docs_members`. Khi có lỗi provision, function cố gắng thu hồi invite mới tạo; không chỉnh sửa tài khoản tồn tại.
2. **DANH SÁCH TÀI KHOẢN RNS DÙNG CHUNG:** ADMIN được xem và tìm trong danh sách Auth user đã tồn tại, trạng thái kích hoạt email, vai trò RNS và vai trò Radar. Nút **CHỌN CẤP QUYỀN** điền thông tin vào form cấp quyền ở dưới. Danh sách tải qua cùng Edge Function và chỉ cho ADMIN.
3. **TÀI KHOẢN RNS ĐÃ CÓ:** Tiếp tục dùng RPC `ops_assign_existing_account` để cấp/đổi quyền Radar. Không tạo user trùng, không đổi mật khẩu hay vai trò RNS của user sẵn có. `ops_disable_existing_account` chỉ khóa quyền Radar, không ảnh hưởng RNS.

**Phân quyền an toàn:** API quản lý tài khoản yêu cầu Supabase JWT và `ops_members.unit = 'ADMIN'` cùng `active=true`, không dựa vào dữ liệu vai trò do trình duyệt gửi. Không đưa service-role hoặc key bí mật vào file HTML/JS. Tài khoản quản trị Radar không thể tạo tài khoản ADMIN mới từ biểu mẫu. Nhân viên nhận lời mời phải kích hoạt qua email; không khẳng định thư đã đến hộp thư cho đến khi người dùng xác nhận. Nếu email đã có tài khoản RNS, ADMIN chuyển sang mục cấp quyền hiện có, không lập tài khoản thứ hai.

**Cách sử dụng:** Đăng nhập tài khoản ADMIN Radar → QUẢN LÝ → nếu nhân viên chưa có tài khoản, GỬI LỜI MỜI; nếu đã có tài khoản RNS, chọn từ danh sách hoặc điền email, CẤP QUYỀN RADAR. Sau khi kích hoạt, nhân viên đăng nhập Radar bằng cùng email và mật khẩu RNS.


## V2.6 – KHẮC PHỤC TAB ĐIỀU HÀNH TRỐNG, KHÔI PHỤC BẢNG NHẬP XE GIAO CA ĐH

- **Nguyên nhân:** Từ V2.4, module tổng quan cũ `SagsUIV19.renderHome` không được gọi trong vòng đời đăng nhập và tải ngày; module bảng xe `SagsShuttleGridV24.setUnit` cũng không được khởi tạo. Giao diện trống là lỗi nối module, không phải thiếu quyền Supabase.
- **ĐIỀU HÀNH:** Khi tài khoản ĐH đăng nhập, khởi tạo dashboard với các ô chuyến đến, chuyến đi, đỉnh Radar, quy trình Dự báo Lần 1/Lần 2, tình trạng nguồn lực theo phòng và nút xem báo cáo. Khi chọn ngày hoặc tải lại dữ liệu, dashboard tự làm mới.
- **Xe giao ca:** Bảng nhập 5 cột ĐH, PVSĐ, PVHK, KHO HÀNG, QA/IT được khởi tạo ở tab ĐIỀU HÀNH ngay sau khi đăng nhập; tài khoản ĐH chỉ nhập cột ĐH. Mỗi khung giờ có nút + dòng bổ sung, lưu và xác nhận ngay trên đúng hàng. Khi tải ngày mới bảng tự nạp dữ liệu đúng ngày.
- **Ổn định:** Nếu riêng phần tổng quan lỗi hiển thị, hệ thống không chặn khởi tạo bảng xe. Đã thêm kiểm thử vòng đời cho role ĐH, QA, IT và đường đi dự phòng. Không thay đổi schema, dữ liệu, quyền RNS hoặc quyền ghi Supabase.


## V2.7 – Xóa giờ xe thừa an toàn, cảnh báo thiếu thông tin màu đỏ, đồng nhất file xuất

**Bảng xe giao ca:** Trong cột '+' cạnh giờ xe có thêm nút **× màu đỏ** dành cho mốc giờ **người dùng tự thêm** và các dòng **Bổ sung 1, 2...**. Giờ gốc 10 mốc theo ảnh không thể xóa. Khi bấm ×, ứng dụng yêu cầu xác nhận; máy chủ kiểm tra đúng ngày, chiều, giờ, dòng, vai trò người dùng. Nếu chưa có dữ liệu hoặc **chỉ có số liệu do phòng mình đã xác nhận**, có thể xóa; nếu phòng khác đã nhập, hệ thống từ chối để không xóa dữ liệu của phòng đó. ADMIN không xóa hàng đã có số liệu. Tài khoản VIEWER không có quyền xóa. RPC `ops_remove_shuttle_addition` thực thi kiểm tra bằng Supabase server-side, không thực hiện xóa trực tiếp từ trình duyệt.

**BÁO CÁO – CẢNH BÁO MÀU ĐỎ:** Có khối riêng phía trên BÁO CÁO tự tải dữ liệu theo ngày. Kiểm tra **từng đơn vị trong 5 cột** của hai chiều xe, kể cả dòng bổ sung, hiển thị thiếu theo phòng/chiều/giờ; ngoài xe, kiểm tra **PVSĐ bốc xếp/lái GSE theo ca**, **PVHK đội đến/đi theo ca**, **GSE khả dụng đã xác nhận**, và **Kho Hàng có kế hoạch KG/PCS/giờ hàng sẵn sàng**. Nếu chưa có kế hoạch cargo thì báo **chưa nhận kế hoạch hoặc chưa xác nhận không phát sinh**, không tự kết luận có hàng. Ghi rõ ô trống ≠ 0. Các dòng chưa đủ dữ liệu có **màu đỏ** trong xem trước và Word Dự báo Lần 1. Khi ngày đổi hoặc bấm XEM TRƯỚC, cảnh báo được tải lại.

**Ảnh/PDF XE GIAO CA:** Cùng một Canvas dựng giao diện xem trước và tải ảnh PNG, không dùng hai mẫu. PDF cho ngày bình thường được tạo theo **đúng tỷ lệ trang ảnh gốc** nhằm hạn chế co kéo/khác bố cục, số hàng nhiều thì chia trang. Dòng nào chưa đủ 5 đơn vị xác nhận có chữ màu đỏ; chỉ có xe 29/45 chỗ, không tạo xe cỡ khác. Logo SAGS giữ nguyên file gốc EREPORT. Mọi nút xuất tập trung tại BÁO CÁO, chỉ ĐH/ADMIN được phát hành.

**Nghiệm thu:** Đã thêm kiểm thử tự động về phân quyền và xóa mốc tự chọn, chuẩn hóa các tình huống missing QA/IT, hàng bổ sung và số 0 đã xác nhận. Cần thử trực tiếp trên tài khoản thực tế để xác nhận hiển thị/thiết bị.


## V3.11 – TỐI GIẢN NHẬP BÁO CÁO & XE GIAO CA (31/10/2026)

**Nhập báo cáo điều hành D+1:** Vào đúng phòng ở thanh bên. Khối "Dữ liệu tự lấy từ lịch bay" chỉ để xem số cặp chuyến, bãi đã có nguồn và số chuyến charter; không nhập lại lịch/STA/STD, bãi đỗ hoặc khung cao điểm. Nhập quân số ở bảng 2 ca, các vai trò chính ở trên; mở "Nhóm nhân sự bổ sung" nếu cần. Với PVSĐ, chỉ khai báo thiết bị mới hỏng/hạn chế/phục hồi hoặc số GSE khả dụng cần điều chỉnh; nhóm điều chỉnh GSE là tùy chọn. Với PVHK chỉ thêm phương án quầy/gate hoặc khách đặc biệt có nguồn. Với Điều hành chỉ thêm cập nhật AOC, yêu cầu riêng của hãng/charter và vấn đề xin ý kiến. Với QA/IT chỉ nhập an toàn/FOD/thời tiết/tồn tại có ảnh hưởng. Khối nhận định bổ sung được thu gọn; chỉ mở khi cần ghi ngoại lệ. **Không tự coi dữ liệu trống là 0 hoặc đã xác nhận đủ nguồn lực.**

**Kho hàng:** Trong "Hàng đi đã được Kho xác nhận", nhập mỗi chuyến một dòng (số hiệu chuyến, booking KG, PCS nếu có, giờ hàng sẵn sàng). Chọn **+ THÊM CHUYẾN CÓ HÀNG** để nhập nhiều chuyến; bấm **LƯU & XÁC NHẬN PHÒNG** một lần. Dòng hoàn toàn trống không được hiểu là không có hàng. Không tự suy đoán booking. Phân biệt nhóm 100–200 kg, dưới 2,5 tấn và từ 2,5 tấn trở lên theo xác nhận của Kho và thỏa thuận hiện hành. Các dòng đã lưu được tải lại để chỉnh khi cần.

**Xe giao ca:** Thanh bên **XE GIAO CA** hiển thị hai chiều xe, giờ chạy, 4 cột số người ĐH/PVHK/PVSĐ/QA & IT và cột tổng; **không hiển thị gợi ý xe/ảnh xe trong khu vực nhập**. Mỗi phòng nhập cột của mình, ô trống = chưa xác nhận, 0 = đã xác nhận không có người, ký hiệu ~ ở tổng = chưa đủ 4 phòng. Bấm **LƯU TẤT CẢ THAY ĐỔI** sau khi nhập cả hai chiều. Chức năng thêm giờ xe có lý do và quản lý giờ bổ sung vẫn nằm trong phần có thể mở. Bảng xuất PNG/PDF vẫn thể hiện gợi ý xe và hình xe minh họa **đã thu nhỏ**; ảnh xem trước và bản xuất dùng cùng nguồn tạo ảnh.

**Mốc xe đúng:** NHA → CXR: 07:00, 17:30, 19:30. CXR → NHA: 16:30, 18:30 trong ngày khai thác và 02:00, **08:15 ngày hôm sau**. Không có chuyến 08:30 trong ngày. 08:15 vẫn ghi "08:15" (không hậu tố +1), có nhãn "NGÀY HÔM SAU" để phân biệt. Dữ liệu 08:30 trùng của ngày khai thác 01/11/2026 được xóa có điều kiện sau khi xác nhận 08:15 ngày hôm sau đã có cùng số người của từng bộ phận. Dữ liệu xe thực có và giờ bổ sung khác không bị thay đổi.

## V3.12 – DIỄN GIẢI ĐÚNG CÁC CÔNG ĐOẠN PHỤC VỤ HÀNH KHÁCH (31/10/2026)

- Trong **báo cáo dự báo điều hành Lần 1, Lần 2**, không dùng câu PVHK chung chung “bố trí người đón, tiễn khách” như thể đó là toàn bộ nhiệm vụ. Phải diễn đạt đủ **phân công nhân sự làm thủ tục tại quầy check-in**, **phục vụ/kiểm tra thẻ lên tàu và hướng dẫn khách tại cửa ra tàu bay (gate/boarding)**, **đón khách chuyến đến và tiễn khách chuyến đi tại tàu bay**. Mô tả theo **lịch từng chuyến và từng công đoạn**, không tự nhận định đủ người khi thiếu dữ liệu xác nhận.
- Khi có **khung cao điểm, nhiều chuyến chồng lấn hoặc quay đầu ngắn**, PVHK phải **rà soát, điều tiết nhân sự giữa các vị trí** trên cơ sở quân số thực tế và các công đoạn đang triển khai; không đề nghị điều chuyển người khỏi quầy/gate/tàu bay khi chưa hoàn tất nhiệm vụ.
- Khi có **thay đổi STA/STD, bãi đỗ, gate hoặc giờ boarding**, báo cáo thể hiện việc PVHK điều chỉnh kế hoạch nhân sự tại quầy làm thủ tục, cửa boarding và tàu bay; ĐH theo dõi, phối hợp các đơn vị liên quan. Chỉ kết luận bố trí đủ/thiếu khi nguồn nhân sự, định mức và phân bổ theo giờ được xác nhận.
- **Bản xem trước, xuất Word/PDF dùng cùng nguồn báo cáo**; các đoạn phân tích Lần 2 về cao điểm/tàu thân rộng/boarding giữ nguyên mô tả công đoạn đầy đủ, không bị cắt thành câu thiếu nhiệm vụ. Ghi chú do người dùng xác nhận/biên tập thủ công vẫn được ưu tiên.
- Không thay đổi công thức tính giờ cao điểm, định mức phục vụ, dữ liệu chuyến bay, dữ liệu xe hoặc quyền nghiệp vụ ở phiên bản này.

**Ví dụ câu báo cáo chuẩn:** “PVHK chủ động sắp xếp nhân sự làm thủ tục hành khách tại quầy check-in, phục vụ tại cửa ra tàu bay (gate/boarding), đón khách chuyến đến và tiễn khách chuyến đi tại tàu bay theo lịch từng chuyến; trong giờ cao điểm rà soát điều tiết người theo công đoạn, không rút nhân sự khỏi vị trí vẫn đang phục vụ.”
