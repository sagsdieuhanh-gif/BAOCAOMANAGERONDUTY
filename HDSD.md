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


## V3.13 – XUẤT PDF BÁO CÁO TRÊN KHỔ A4 DỌC (31/10/2026)

- Vào **BÁO CÁO TGĐ** hoặc mục **Báo cáo điều hành D+1**, tạo/xem lại bản dự báo Lần 1 hoặc Lần 2, sau đó chọn **XUẤT PDF**. File PDF báo cáo sử dụng **A4 dọc (210 × 297 mm)**, có lề khoảng **11 mm**, số trang ở cuối từng trang; nội dung được dàn riêng để dễ đọc, không ép nguyên bảng ngang thành một trang dọc.
- Tiêu đề và nội dung được thu gọn ở mức khoảng **10–13 pt**, phần bảng khoảng **8–9 pt**; các cột có độ rộng theo loại bảng (kiểm soát 10 nội dung, cao điểm, phối hợp), ưu tiên cột phương án và nội dung dài. Chữ được tự xuống dòng trong ô; **không cắt bỏ số liệu, nhận định, phương án hoặc thông tin chưa xác nhận** chỉ để tiết kiệm diện tích.
- Khi bảng dài sang trang tiếp theo, **lặp lại hàng tiêu đề**. Nếu một dòng bảng dài hơn phần còn lại của tờ giấy, dòng được tiếp tục ở tờ sau, vẫn đủ toàn bộ nội dung; không kéo dài khỏi lề in. Trang có số thứ tự **TRANG x/y**.
- Bản **Word vẫn giữ định dạng cũ** và dữ liệu gốc không bị chỉnh sửa. PDF xe giao ca (xuất từ ảnh xe) **tiếp tục theo định dạng riêng**, không bị chuyển thành báo cáo dọc. Mẫu PDF báo cáo Radar dùng chung bộ xuất báo cáo cũng được canh theo giấy dọc.
- Nếu PDF có nhiều trang hơn trước, đó là vì chữ phải giữ cỡ đọc được và không được cắt nội dung; không đặt mục tiêu ép tất cả thông tin lên một trang.


## V3.14 – HIỂN THỊ QUÂN SỐ ĐH, PVHK, PVSĐ TRONG BÁO CÁO (31/10/2026)

- Khi **ĐH, PVHK, PVSĐ** nhập và xác nhận nhân sự tại không gian làm việc, hệ thống lưu từng số người vào **ops_staff_capacity** theo ngày khai thác, đơn vị, vị trí công việc, ca sáng/đêm. Người dùng **không phải nhập lần thứ hai tại mục báo cáo**.
- Chọn **BÁO CÁO TGĐ** hoặc **Báo cáo điều hành D+1 → TẠO/CẬP NHẬT BẢN XEM TRƯỚC**. Báo cáo **Lần 1 và Lần 2** tự đọc lại dữ liệu nhân sự trực tiếp theo đúng ngày trong kho dữ liệu mỗi lần lập/xuất, không dùng bảng nhân sự trong bộ nhớ chưa được làm mới.
- Ngay trong **mục II – Bảng kiểm soát**, sau bảng 10 nội dung có **bảng CHI TIẾT QUÂN SỐ ĐÃ XÁC NHẬN**: ĐH, PVHK, PVSĐ → từng vị trí công việc → ca sáng → ca đêm. Hiển thị đầy đủ trong màn hình, xuất Word, xuất PDF A4 dọc. **0 người là số đã xác nhận**, không được đổi thành trống. Không có dữ liệu cho một ca thì ghi **CHỜ XÁC NHẬN**.
- Phân biệt 2 trạng thái: **ĐÃ XÁC NHẬN QUÂN SỐ** nghĩa là số người thực tế đã được phòng lưu; **CHƯA ĐÁNH GIÁ ĐỦ/THIẾU** nghĩa là chưa có kết luận nhân sự đáp ứng định mức/nhu cầu. Không dùng trạng thái PENDING của đánh giá đủ/thiếu để ẩn số người đã xác nhận.
- Với **PVSĐ**, các nhóm bốc xếp, lái GSE, lái Cobus, SKYONE, hành lý nhà ga là **các con số theo vị trí**; không cộng cơ học thành tổng số người độc lập do có khả năng kiêm nhiệm. Các dòng khung giờ SKYONE đặc biệt không được cộng trùng với số SKYONE ca sáng/đêm trong bảng chính.
- **Nếu dữ liệu không hiển thị**, kiểm tra ngày khai thác đã chọn; nếu báo cáo báo lỗi tải quân số thì kiểm tra kết nối/đăng nhập, không được tự suy đoán rằng các phòng chưa gửi.
- Báo cáo Lần 2 **không được rút ngắn phần nhân sự** để chèn ghi chú check-in, gate, boarding. Nhận định nghiệp vụ riêng vẫn hiển thị tại mục phù hợp.


## V3.15 – QUÂN SỐ THỰC TẾ, KHÔNG TỰ ĐÁNH GIÁ ĐỦ/THIẾU; TÙY CHỌN ẨN CẢNH BÁO TRONG PDF

- Mục **Nhân lực khai thác** trong báo cáo Lần 1/Lần 2 chỉ thể hiện **số người đã xác nhận** theo bộ phận, vị trí và ca sáng/đêm. Báo cáo không ghi “đủ”, “thiếu”, “đảm bảo”, “chưa đảm bảo”, “chưa đánh giá đủ/thiếu” hoặc tự so sánh tổng quân số với nhu cầu. Việc xác định đủ hay thiếu nhân sự là nghiệp vụ riêng và chỉ thực hiện khi có định mức/thỏa thuận được xác nhận, không suy đoán từ số liệu ca.
- Các nhóm PVSĐ có thể kiêm nhiệm; bảng quân số không cộng các vai trò thành tổng người độc lập khi chưa kiểm tra trùng. Dữ liệu nhân sự đã xác nhận không bị thay đổi.
- **Xuất PDF báo cáo:** phía trên báo cáo chính hoặc trong mục **Báo cáo điều hành D+1** có ô **“Ẩn thông tin chưa xác nhận khi xuất PDF”**, được tích sẵn. Khi tích, khối **“THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU CÁC ĐƠN VỊ BỔ SUNG”** (ví dụ cảnh báo GSE hoặc KG/PCS/giờ Kho hàng) chỉ được ẩn khỏi file PDF, không xóa dữ liệu, không làm biến mất khối này ở màn hình xem trước và không áp dụng cho bản Word.
- Nếu cần bản PDF đầy đủ cả các cảnh báo chờ bổ sung, **bỏ tích ô này trước khi chọn XUẤT PDF**. Cả hai chế độ vẫn giữ đầy đủ số liệu lịch bay, nhận định, phương án và bảng quân số.
- Xuất PDF vẫn dùng A4 dọc theo V3.13; không tác động xuất ảnh/PDF xe giao ca, kết quả Radar hoặc dữ liệu lịch bay.


## V3.16 – BÁO CÁO LẦN 2 TỰ HOÀN THIỆN TỪ LỊCH ĐÃ DUYỆT

**Luồng thực hiện:** Mở LỊCH BAY/EXCEL → tải file có đủ ARRIVAL và DEPARTURE → kiểm tra dữ liệu → chọn **DUYỆT VÀ LƯU LẦN 2**. Sau khi máy chủ xác nhận lưu, ứng dụng **tự dựng lại bản xem trước báo cáo** và **đồng bộ Báo cáo TGĐ trong workspace**, không cần nhập lại số liệu các phòng. Lần 1 không bị ghi đè và được dùng làm mốc đối chiếu.

**Quy tắc nhận định và trình bày:**
- Báo cáo Lần 2 sử dụng **đúng lịch, giờ STA/STD, bãi đỗ, gate, booking, tàu thân rộng, charter/ferry và các xác nhận của đơn vị đang lưu theo ngày**. Không lấy bãi ngày trước hoặc tự tạo giờ boarding. Booking không được coi là PAX thực đi.
- Mục I: thể hiện đối chiếu số lượt đến/đi **Lần 1 → Lần 2** theo số liệu từng snapshot; chỉ thêm so sánh ngày liền trước nếu có số liệu ngày đó được xác nhận, không chèn câu “chưa có dữ liệu ngày trước” làm kết luận chính khi đã có Lần 1.
- Mục II gồm **đủ 10 nội dung** với nhận định theo chứng cứ. Vị trí đỗ ghi số hồ sơ tại K1 (31–37, 51–55), K2 (38–42), K3 (56–71) và khung cao điểm liên quan; **PVSĐ là bộ phận trao đổi với ATC và tập kết phương tiện, thiết bị trước khi tàu bay lăn**. Phần nhân sự giữ quân số đã xác nhận và có bảng theo vị trí/ca; booking PVHK là thông tin tổ chức quầy, gate và đón/tiễn khách, không thay thế quân số, không tự kết luận đủ/thiếu theo định mức.
- Kho Hàng: nếu có KG booking đã nhập thì nêu rõ chuyến, KG và nhóm khối lượng có căn cứ; **không đánh giá bản báo cáo là chưa hoàn thiện chỉ do PCS hoặc ready-by đang trống**. Thông tin thực sự thiếu vẫn giữ trạng thái riêng tại nơi kiểm tra nguồn, không tự suy đoán. Cảnh báo có thể ẩn riêng trong PDF bằng tùy chọn từ V3.15.
- Các nội dung **an toàn, tồn tại và trang thiết bị** dùng ghi chú đã được đơn vị xác nhận nếu có; nếu không có ghi chú, chỉ trình bày nhiệm vụ theo lịch, không tự viết như đã xảy ra sự cố, và không khẳng định “không có tồn tại” khi chưa có nguồn.
- Không cắt câu bằng ký tự “…” hoặc các ngưỡng 155/225/290/460 ký tự khi dựng báo cáo Lần 2. Cả 3 khung cao điểm chọn lọc được giữ đầy đủ; Word/PDF theo bản xem trước. PDF tiếp tục A4 dọc. Các nội dung người dùng đã chỉnh và lưu trong kiểm soát báo cáo **được giữ ưu tiên**, không bị nhận định tự sinh ghi đè.
- Nếu file lịch Lần 2 thật sự thiếu dữ liệu bắt buộc, giữ cảnh báo kỹ thuật ở khâu duyệt/lưu và thông tin chờ xác nhận riêng, không tạo dữ liệu giả để làm báo cáo trông hoàn chỉnh.

**Ví dụ kiểm tra dữ liệu nguồn 01/11/2026:** Lần 1: 40 đến, 37 đi. Lần 2: 39 đến, 36 đi; 40 hồ sơ có bãi (K1 23, K2 6, K3 11), 36 chuyến đi có gate, 35 có booking, chưa có giờ boarding trong nguồn; Kho hàng đã lưu KG cho 9 chuyến. Những kết quả này là ví dụ kiểm tra tại thời điểm phát triển, không đóng cứng vào các ngày sau.


## V3.17 – QUÂN SỐ PVSĐ HIỂN THỊ GỌN TRONG MỘT Ô

- Khi vào **PHỤC VỤ SÂN ĐỖ → 01 · QUÂN SỐ THEO CA**, số liệu PVSĐ đã nhập và lưu được hiển thị trong **một khối/ô tóm tắt**, theo đúng thứ tự: **PVSĐ – PVHLNG – BỐC XẾP PVSĐ – SKYONE**. Mỗi nhóm hiển thị **Sáng x người / Đêm y người**; không trải năm nhóm thành nhiều dòng trên giao diện mặc định.
- **PVSĐ**: lấy tổng quân số theo ca đã được phòng xác nhận tại hồ sơ đơn vị; **PVHLNG**: nhóm Hành lý nhà ga; **BỐC XẾP PVSĐ**: bốc xếp tại tàu; **SKYONE**: bốc xếp thuê ngoài. Không suy diễn hoặc cộng ba nhóm còn lại thêm vào tổng PVSĐ do có thể nằm trong tổng đã nhập.
- Các ô nhập chi tiết về **Bốc xếp, Lái xe GSE, Cobus, SKYONE, PVHLNG** được giữ nguyên trong phần **NHẬP / CHỈNH SỬA QUÂN SỐ CHI TIẾT**. Nếu đã có số liệu, phần này **mặc định đóng**; bấm để mở ra chỉnh sửa. Nếu chưa có số liệu, phần này **mở sẵn** để nhập mới.
- Trong **BÁO CÁO LẦN 1/LẦN 2**, bên dưới bảng nhân lực của ĐH và PVHK, toàn bộ PVSĐ được trình bày **trong đúng một ô thuộc một hàng duy nhất**, với cùng bốn nhóm PVSĐ/PVHLNG/BỐC XẾP PVSĐ/SKYONE và đủ ca sáng, ca đêm. Phần nhập liệu, báo cáo Word và PDF sử dụng chung dữ liệu đã xác nhận.
- Số **0 người** là dữ liệu đã xác nhận và phải hiện là 0; phần chưa lưu/không xác nhận hiển thị **CHỜ XÁC NHẬN**, không suy đoán từ tổng ca hoặc nhóm khác.
- Định dạng hiển thị này không xóa hay sửa dữ liệu PVSĐ đã lưu, không thay đổi các cảnh báo/công thức Radar, và không đánh giá đủ/thiếu nhân sự. Để sửa số người, mở chi tiết và bấm **LƯU & XÁC NHẬN PHÒNG** như trước.


## V3.18 – NHÂN SỰ ĐH / PVHK / PVSĐ: MỖI PHÒNG MỘT HÀNG, HAI Ô CA SÁNG & CA TỐI

- Trong **BÁO CÁO LẦN 1 / LẦN 2** (và bản PDF/Word xuất từ phần Báo cáo TGĐ), bảng quân số có **ba hàng ĐH, PVHK và PVSĐ**, với các cột **Bộ phận | CA SÁNG | CA TỐI**. Một phòng không bị tách nhiều dòng theo vị trí.
- **ĐH:** ô CA SÁNG chứa quân số Điều phối ca sáng; ô CA TỐI chứa Điều phối ca tối.
- **PVHK:** ô CA SÁNG chứa **Đội đến: x người · Đội đi: y người**; ô CA TỐI chứa **Đội đến: a người · Đội đi: b người**. Các số vẫn độc lập, chỉ gộp cách hiển thị trong mỗi ca, không tự cộng thành số nhân viên độc lập.
- **PVSĐ:** ô CA SÁNG có **PVSĐ: ... · PVHLNG: ... · BỐC XẾP PVSĐ: ... · SKYONE: ...**; ô CA TỐI có bốn nhóm tương tự lấy từ nguồn ca tối. **PVSĐ** là tổng phòng đã được xác nhận, các nhóm còn lại không cộng thêm một lần vào tổng.
- Trong màn hình **PVHK** và **Phục vụ sân đỗ**, phía trên có **hai ô CA SÁNG và CA TỐI**, mỗi ô gộp các nhóm tương ứng để xem nhanh. Khi đã lưu, các ô nhập chi tiết thu gọn phía dưới, mở bằng **NHẬP / CHỈNH SỬA QUÂN SỐ CHI TIẾT**; khi chưa có dữ liệu chi tiết, mục mở sẵn để nhập.
- Cột hiển thị **CA TỐI** vẫn sử dụng bản ghi **ca ĐÊM** đã lưu ở cơ sở dữ liệu, **không đổi khóa ca hoặc điều chỉnh giờ ca**.
- Giá trị **0** đã xác nhận hiển thị **0 người**; thiếu bản ghi thì ghi **CHỜ XÁC NHẬN**, không ước đoán từ tổng phòng. Các số lái xe GSE/Cobus và các vai trò khác vẫn được giữ trong mục nhập chi tiết, không bị xóa khỏi cơ sở dữ liệu; cũng không đánh giá đủ/thiếu quân số theo định mức.
- Ví dụ dữ liệu nguồn 01/11/2026: **PVHK sáng** Đội đến 16, Đội đi 43; **PVHK tối** Đội đến 16, Đội đi 59. **PVSĐ sáng** Tổng 50, PVHLNG 15, Bốc xếp 8, SKYONE 9; **PVSĐ tối** Tổng 51, PVHLNG 15, Bốc xếp 7, SKYONE 11. Đây là ví dụ kiểm tra, không cố định cho các ngày sau.
