## V3.34 — Giao diện Giáng sinh/Năm mới giống E-Report và ảnh xe giao ca mùa lễ hội (HDSD)

V3.34 kế thừa màu sắc và thời gian hiển thị từ **E-REPORT-SAGS V1.2** (chủ đề Giáng sinh & New Year 2027). Chỉ thay đổi cách trình bày, tuyệt đối không thay đổi dữ liệu nghiệp vụ, biểu mẫu, quyền, số người hay cách tính xe.

### Thời gian áp dụng và bật/tắt
- **27/11–26/12/2026:** Giáng sinh, lời chúc **Merry Christmas & Happy New Year 2027**.
- **27/12/2026–03/01/2027:** Tết Dương lịch, lời chúc **Happy New Year 2027**.
- Sau 03/01/2027: tự trở lại giao diện thường, không cần sửa ứng dụng. Ngày được tính theo giờ Việt Nam.
- Trong giai đoạn lễ hội, giao diện mặc định BẬT. Ở thanh trên có nút **☀ GIAO DIỆN THƯỜNG / 🎄 BẬT LỄ HỘI** để mỗi người tự chọn. Lựa chọn chỉ lưu trên chính trình duyệt đang dùng, không thay đổi người khác và không lưu vào database.

### Giao diện
- Màu xanh navy, vàng champagne, đèn trang trí nhẹ và banner chúc mừng; giữ logo SAGS gốc.
- Màn hình đăng nhập có lời chúc và tuyết nhẹ trên nền, chỉ khi ở giao diện mùa lễ hội. Hỗ trợ chế độ giảm chuyển động, màn hình điện thoại.
- Trang chủ và khu vực điều hướng có viền, nhấn màu vàng; không đưa hình trang trí đè lên trường nhập liệu, dữ liệu, bảng theo dõi, nội dung báo cáo và bản in nghiệp vụ.

### Ảnh xe giao ca PNG/PDF
- Vào **XE GIAO CA** rồi chọn **XEM TRƯỚC / XUẤT PNG / XUẤT PDF** như trước. Khi giao diện lễ hội đang bật, ảnh sử dụng nền đầu/cuối navy, điểm nhấn vàng champagne, lời chúc Giáng sinh hoặc Năm mới, nhưng vẫn **giữ rõ 2 tuyến, 7 giờ xe, 4 đơn vị, quân số, trạng thái xác nhận và gợi ý sức chứa**.
- Khi người dùng tắt lễ hội thì ảnh xuất trở lại giao diện V3.33 thông thường.
- Đặc biệt có nút **🚌 XEM MẪU ẢNH XE** trên thanh trên, chỉ hiện trong mùa lễ hội. Nút này mở ảnh mẫu dựng bằng **dữ liệu minh họa** với watermark “BẢN XEM TRƯỚC · SỐ LIỆU MINH HỌA”, không truy cập Supabase và không tải/ghi dữ liệu thật. Chỉ để duyệt hình thức trước khi xuất ảnh chính thức.
- Ảnh PNG và PDF vẫn lấy từ cùng bộ vẽ, nội dung nghiệp vụ không bị suy đoán hay thay đổi. Không mở tính năng gửi Zalo tự động.

**Kiểm tra:** cú pháp JS, lịch kích hoạt, bật/tắt, việc giữ nguyên thông tin ca xe, màu ảnh PNG và không đọc nguồn trong bản xem trước được kiểm tra bằng mock. Chưa xác nhận hiển thị thực tế trên mọi thiết bị hoặc PDF đã mở thủ công.

## V3.33 — Ảnh xe giao ca tối giản, dễ đọc (HDSD)

Bản cập nhật V3.33 chỉ tinh gọn **ảnh/PDF tổng hợp XE GIAO CA** và phần xem trước ảnh tương ứng. Không thay đổi giờ xe, số lượng nhân sự, dữ liệu nguồn, cách tính gợi ý sức chứa, phân quyền hoặc thông tin được lưu.

### Nội dung ảnh mới

- Tiêu đề ngắn **XE GIAO CA · SAGS CXR** và **ngày khai thác**.
- **Hai cột tuyến xe:** NHA TRANG → CAM RANH (xe đi làm) và CAM RANH → NHA TRANG (xe về).
- **Mỗi mốc xe:** giờ chạy (lớn, nổi bật), **tổng số người đã nhập**, quân số từng đơn vị **ĐH / PVHK / PVSĐ / QA & IT**, trạng thái **ĐỦ 4/4 ĐƠN VỊ / TẠM TÍNH x/4 / CHỜ 4 ĐƠN VỊ**, gợi ý xe theo sức chứa ngắn gọn khi có quân số. Giờ bổ sung có nhãn riêng.
- Không đưa số **0 người** nếu chưa có đơn vị nào nhập; khi không có nguồn phải hiện **— / CHƯA NHẬP**. Với mốc chưa đủ 4 đơn vị, tổng số người và gợi ý xe vẫn ghi **TẠM TÍNH**, không tự kết luận số xe cần điều.
- Dòng cuối chỉ còn số mốc, số đủ xác nhận, số chưa xác nhận và một câu lưu ý: **gợi ý xe không xác nhận xe khả dụng**.

### Đã bỏ khỏi ảnh

- Dải **GỢI Ý XE THEO GIỜ** lặp ở đầu ảnh.
- Chi tiết **số ghế dư**, thống kê **trên 45 người**, bảng 5 chỉ số và 3 dòng chú thích dài ở cuối.
- Hình xe trang trí không còn sử dụng để tránh tải tài nguyên thừa. Số lượng/loại xe vẫn xuất ở dạng chữ dễ đối chiếu.

### Cách xuất

Vào **XE GIAO CA** trong MANAGER ON DUTY, nhập/xác nhận quân số theo từng mốc như trước, sau đó dùng chức năng **XEM TRƯỚC / XUẤT ẢNH PNG / XUẤT PDF** hiện có. Cả xem trước, PNG và PDF sử dụng **cùng bản vẽ**, không có mẫu khác nhau.

Giữ nguyên các mốc xe: **NHA→CXR 07:00, 17:30, 19:30; CXR→NHA 16:30, 18:30, 02:00, 08:15**. Mốc 08:15 hiển thị đúng **08:15**, không có dấu cộng.

**Kiểm thử:** mô phỏng 7 mốc, đủ/thiếu xác nhận, quân số bằng 0, phân bổ 4 đơn vị, gợi ý xe và giờ chuẩn. Chưa xác minh trực quan trên thiết bị người dùng hoặc file PDF thực tế.

## V3.32 — Đưa 10 mục nhận định vào khung như các bảng phía dưới (HDSD)

Từ **BÁO CÁO → TẠO / CẬP NHẬT BẢN XEM TRƯỚC**, phần **II. NHẬN ĐỊNH VÀ PHƯƠNG ÁN TỔ CHỨC PHỤC VỤ** hiển thị **10 khung có viền** cho các nội dung 01–10.

- **Mỗi khung:** hàng đầu có số mục và tên nội dung; dưới đó là 2 ô **NHẬN ĐỊNH TRỌNG TÂM** và **PHƯƠNG ÁN TỔ CHỨC PHỤC VỤ** với đường kẻ phân cách; cuối cùng là hàng **ĐƠN VỊ THỰC HIỆN** nếu có dữ liệu.
- **Bản xem trước:** dùng màu tiêu đề, đường viền và cấu trúc ô đồng nhất với bảng ở các mục III–IV. Điện thoại tự xếp hai nội dung theo chiều dọc nhưng vẫn giữ đủ khung.
- **XUẤT WORD:** 10 khung là các **bảng Word có đường viền thật**, tiêu đề và dòng đơn vị thực hiện là các ô gộp; không bị mất khung khi xuất.
- **XUẤT PDF:** giữ đường kẻ từng ô, hàng tiêu đề, hàng đơn vị thực hiện; nếu nội dung dài, ngắt trang và nhắc lại tiêu đề/nhãn cột để bảo toàn toàn bộ chữ.
- Không thay đổi bất kỳ dữ liệu, nhận định, phương án, số liệu sản lượng, biểu đồ Peak Hours, phân quyền hay tính toán nào. Không ghi/sửa dữ liệu ở Supabase.

**Kiểm tra:** đã kiểm tra mô phỏng đủ 10 khung, trường hợp thiếu đơn vị thực hiện và một mục dài phải sang trang, không cắt nội dung. Chưa kiểm thử trực quan file PDF/Word xuất từ trình duyệt thực tế.

## V3.31 — Xuất biểu đồ Peak Hours sắc nét (HDSD)

Khi xem hoặc xuất **Báo cáo điều hành D+1 → PHÂN BỔ LƯỢT BAY THEO GIỜ (STA / STD) → PEAK HOURS · 24 GIỜ**:

- **Trên màn hình:** biểu đồ vẫn hiển thị theo đúng nguồn và 4 nhóm màu hiện tại, không thay đổi số liệu/trục giờ.
- **XUẤT WORD:** dùng SVG gốc với tỷ lệ hình `1120 × 405` để tạo ảnh PNG `3360 × 1215` (3 lần độ phân giải). Không ép chiều cao biểu đồ vào khung 165 px như trước; cột, chữ, các nhãn trục và chú giải giữ đúng tỷ lệ.
- **XUẤT PDF:** trang báo cáo dùng kết xuất 3x A4 (1785 × 2526 px) thay cho 2x; biểu đồ được giữ đúng tỷ lệ và mã hóa ảnh chất lượng cao hơn. PDF có thể nặng hơn bản cũ, và số trang tùy nội dung thực tế.
- **Cách dùng:** mở **BÁO CÁO → TẠO / CẬP NHẬT BẢN XEM TRƯỚC → XUẤT WORD hoặc XUẤT PDF**, sau đó mở file và phóng to biểu đồ để kiểm tra.
- Không thay đổi cách tính Peak Hours, số chuyến, thứ tự màu, bố cục 10 nội dung báo cáo, các nguồn xác nhận hay quyền truy cập. Các hình ảnh không phải SVG tiếp tục sử dụng luồng xuất cũ.

**Lưu ý kiểm thử:** kiểm tra cú pháp và xác minh SVG Peak Hours được nhận đúng tỷ lệ/kích thước bằng bài thử tự động. Chưa kiểm chứng trực quan trên Word/PDF thực tế ở từng thiết bị.

## V3.30 — Báo cáo điều hành dễ đọc hơn (HDSD)

Bản V3.30 chỉ thay đổi **cách trình bày báo cáo**; không làm thay đổi dữ liệu nguồn, nghiệp vụ nhập/xác nhận, quyền truy cập, cách tính sản lượng, cao điểm, GSE hay booking.

### Xem báo cáo
1. Vào **BÁO CÁO** và chọn **TẠO / CẬP NHẬT BẢN XEM TRƯỚC**.
2. Phần **I. Tóm tắt khai thác** giữ số liệu, biến động và trọng điểm; biểu đồ theo giờ được mở rộng để dễ đọc.
3. Phần **II. Nhận định và phương án tổ chức phục vụ** vẫn có đủ **10 mục** như trước, nhưng mỗi mục có một tiêu đề riêng, bên dưới chia thành:
   - **NHẬN ĐỊNH TRỌNG TÂM**: dữ liệu và nguy cơ có căn cứ.
   - **PHƯƠNG ÁN TỔ CHỨC PHỤC VỤ**: việc cần phối hợp/chuẩn bị.
   - **ĐƠN VỊ THỰC HIỆN**: đầu mối theo đúng dữ liệu báo cáo.
4. Nội dung bổ sung từ các đơn vị đã xác nhận được tách thành **đoạn riêng**. Không gộp hết vào một dòng và không cắt bỏ thông tin đã cung cấp.
5. Phần **quân số theo ca**, **thông tin các phòng**, **khung giờ ưu tiên**, **phân công phối hợp** và **kiến nghị Ban TGĐ** vẫn ở cùng thứ tự nghiệp vụ như trước.

### Xuất Word và PDF

- Dùng nút **XUẤT WORD** hoặc **XUẤT PDF** như cũ.
- Phiên bản mới không cố nén báo cáo vào đúng hai trang; có thể phát sinh thêm trang khi dữ liệu dài để giữ cỡ chữ dễ đọc.
- Word/PDF dùng cùng trình tự nội dung và đầy đủ dữ liệu của bản xem trước. Các điều khiển ẩn thông tin chưa xác nhận khi xuất PDF giữ nguyên.
- Trên điện thoại, mục **Nhận định** và **Phương án** tự xếp dọc, tránh bảng ba cột chữ nhỏ.

**Kiểm tra nguồn:** Chỉ phản ánh dữ liệu đã có. Bản này không tự kết luận đủ nhân sự, đủ thiết bị, có booking hoặc đã khắc phục sự việc nếu chưa có xác nhận.

## V3.29 — Nhập dữ liệu theo cấu trúc báo cáo TGĐ (HDSD)

**Mục tiêu:** mỗi thông tin được đơn vị xác nhận phải đi vào đúng nội dung của báo cáo, không cần nhập lại dữ liệu có từ Excel lịch bay. Các chức năng nhập lịch Lần 1/Lần 2, booking, quân số, phân quyền, xác nhận và xuất Word/PDF giữ nguyên.

### 1. Các phòng nhập như sau

- **Phòng Điều hành:** nhập tổng quân số **ca sáng/ca tối**; Điều phối chỉ là nhóm bổ sung, không coi là toàn phòng. Mục nội dung bổ sung gồm AOC/bãi đỗ (Mục 04), ưu tiên cao điểm/yêu cầu hãng (Mục 02), kiến nghị hoặc vấn đề cần phối hợp (Mục 10).
- **PVHK:** nhập nhân sự 3 nhóm (Cán bộ Phòng, Đội khách đi, Đội khách đến) theo ca; nhập phương án quầy/gate/boarding (Mục 05), khách đặc biệt (Mục 03), bố trí chuyến thân rộng/khách đông (Mục 03), nguy cơ hành lý (Mục 07).
- **PVSĐ:** nhập nhân sự 6 nhóm theo ca, tách đúng chính/SKO/TC. Mục GSE: nhập mã xe, trạng thái, hư hỏng/hạn chế, **ảnh hưởng**, **phương án thay thế**, thời gian dự kiến (nếu được xác nhận). Khi muốn sửa xe cũ phải chọn mã ở “Chỉnh sửa thiết bị đã báo”, không ghi đè tùy tiện bằng cách nhập trùng mã. Các ghi chú điều phối, nhân lực, tàu thân rộng, GSE được ánh xạ lần lượt vào Mục 02, 05, 03, 06.
- **Kho hàng:** nhập booking **chuyến đi và chuyến đến** riêng từng bảng; có thể chọn sửa/xóa booking từng chuyến theo V3.27. Nhập ưu tiên bàn giao, nguy cơ chậm và hàng đặc biệt ở Mục 07; phần nhân sự Kho nằm trong khối **tùy chọn** và nếu được xác nhận sẽ được phản ánh ở Mục 07, không tự cộng vào bảng quân số ĐH/PVHK/PVSĐ.
- **QA/IT:** ghi thông tin an toàn, FOD, thời tiết đã xác nhận (Mục 09), ảnh hưởng và biện pháp phòng ngừa (Mục 09), tồn tại và kết quả theo dõi (Mục 10).

### 2. Xem trước / chỉnh sửa / xóa nội dung

- Mỗi ô ghi chú hiển thị **Mục báo cáo nhận thông tin**. Khi gõ hoặc xóa, khu vực **XEM TRƯỚC THÔNG TIN VÀO BÁO CÁO** cập nhật ngay mà **chưa ghi vào Supabase**.
- **XÓA NỘI DUNG** trên từng ghi chú chỉ làm trống nội dung đang nhập; để thay đổi bản đã lưu phải bấm **LƯU & XÁC NHẬN PHÒNG**. Với GSE dùng **XÓA NỘI DUNG ĐANG NHẬP** để bỏ bản nháp, không xóa thiết bị đã lưu.
- GSE đã báo: chọn mã xe có sẵn để điền lại toàn bộ trường, chỉnh sửa và xác nhận; hệ thống không tự xóa các giá trị chưa nhập của thiết bị khác.
- Khi lưu, dữ liệu đơn vị chỉ được tổng hợp khi trạng thái hồ sơ đơn vị là **CONFIRMED**. Các trường trống tiếp tục là **CHỜ XÁC NHẬN**, không có suy diễn “không phát sinh” hoặc “đủ nhân sự”.
- Mỗi ghi chú đã xác nhận được ánh xạ đến **nhận định hoặc phương án** ở 10 mục báo cáo *sau* các lớp tổng hợp tự động. Nội dung do Điều hành phê duyệt/nhập thủ công được giữ, không bị thay thế; thông tin đơn vị là bằng chứng bổ sung có nguồn.
- Bảng quân số ĐH/PVHK/PVSĐ vẫn theo chuẩn hiện tại và không được cộng trùng SKO/TC; các dòng booking hàng đi/đến vẫn tính riêng. Word/PDF sử dụng chung bản xem trước báo cáo đã tổng hợp.

### 3. Giới hạn

Đây là giao diện nhập và cầu nối báo cáo; **không** tạo nguồn booking, khối lượng, nhân lực, tình trạng GSE hoặc sự kiện mới nếu chưa có dữ liệu thực tế. Mọi dữ liệu đã lưu trước V3.29 giữ nguyên, không có migration hay ghi đè dữ liệu lịch sử.

## V3.28 — Sửa lỗi tự lưu Excel `INVALID_FLIGHT_ROW` (HDSD)

- **Lịch bay → Nhập Excel:** chọn file **LICH BAY SAGS** có sheet `LB`. Hệ thống đọc và kiểm tra các cặp chuyến trước khi tự lưu.
- **Giờ chuyến ngày hôm sau:** ký hiệu `+` được hiểu là ngày tiếp theo (ví dụ `07:00+` = phút 1860 tính từ 00:00 ngày khai thác). Mốc giờ hợp lệ theo bộ đọc Excel đến `23:59+`; dữ liệu được giữ nguyên khi lưu.
- **Ghép chuyến:** chỉ ghép đến–đi khi STD **sau** STA. Nếu hai chuyến có cùng giờ (hoặc không đủ căn cứ), ứng dụng không tự ghép và hiển thị trong các chuyến chưa ghép cần đối chiếu.
- **Nếu nguồn có dòng không hợp lệ:** ứng dụng hiển thị số dòng sheet `LB`, số hiệu chuyến và lý do (ví dụ `STD không sau STA`), không tự sửa giờ hoặc số hiệu. Sửa/kiểm tra file nguồn rồi chọn lại chính file đó để nhập.
- **Không ghi dữ liệu nửa chừng:** bản nhập dùng hàm `ops_import_sags_schedule` trong một giao dịch. Nếu kiểm tra thất bại, giao dịch bị hủy, không ghi một phần lịch.
- **Quy tắc máy chủ:** `ops_flights_valid_times` và hàm nhập lịch đã đồng bộ mức tối đa 2880 phút với cách đọc thời gian ngày hôm sau. Các quy tắc phân quyền, kiểm tra số lượng, trùng chuyến và nguồn bản Lần 1/Lần 2 giữ nguyên.

**Ghi chú kiểm thử:** đã kiểm thử mô phỏng 4 trường hợp: giờ bình thường, qua nửa đêm, giờ ngày hôm sau vượt 30:00, cặp có STA = STD. Chưa dùng lại file cụ thể từng báo lỗi vì file đó chưa được cung cấp trong cuộc trò chuyện.

## V3.27 — Xóa booking hàng hóa nhập sai (HDSD)

Trong **Kho hàng → 01 · Booking hàng hóa**, mỗi dòng ở bảng **Chuyến bay đi** và **Chuyến bay đến** có nút **XÓA**.

- **Dòng đang nhập, chưa bấm LƯU & XÁC NHẬN PHÒNG:** chọn **XÓA** để bỏ riêng dòng. Nếu dòng đã có dữ liệu, ứng dụng hỏi xác nhận. Chưa có thay đổi nào ở Supabase.
- **Booking đã lưu:** chọn **XÓA**, kiểm tra **số hiệu chuyến, ngày khai thác, trọng lượng** trên hộp thoại rồi xác nhận. Ứng dụng xóa *một bản ghi* đúng mã booking/ngày/chuyến trong `ops_warehouse_cargo_plan`; không xóa lịch bay, các booking khác hoặc dữ liệu nhân sự.
- **Booking không khớp lịch hiện tại:** mở khối “booking chưa khớp chuyến đi/đến”, dùng **XÓA BOOKING** tại dòng cần loại bỏ. Không tự gán sang hàng đi/đến.
- **Khi xóa thành công:** số tổng booking hiển thị được tính lại. Các ô đang nhập dở trên cùng trang không bị làm mới.
- **Khi xóa thất bại hoặc bản ghi đã được đồng nghiệp cập nhật:** không tự xóa khỏi màn hình; dùng nút **Đồng bộ** để kiểm tra trước khi thao tác lại.
- **Phân quyền:** chỉ người có quyền nhập Kho hàng (Kho hàng, Điều hành, ADMIN) được xóa theo chính sách RLS hiện hành.
- **Trường hợp chỉ muốn sửa khối lượng/PCS/giờ sẵn sàng:** chỉnh ngay trên dòng và bấm **LƯU & XÁC NHẬN PHÒNG**, không cần xóa rồi nhập lại.

**Lưu ý:** Nút xóa trong V3.27 áp dụng cho booking hàng hóa; không dùng nó để xóa dữ liệu lịch bay hoặc các loại bản ghi nghiệp vụ khác.

## V3.26 — Tài khoản dùng chung, phân quyền RNS / Báo cáo độc lập

- Supabase Authentication dùng chung email và mật khẩu, nhưng **quyền truy cập ứng dụng được cấp riêng** bằng `sags_docs_members` (RNS) và `ops_members` (Báo cáo khai thác ngày).
- Trong **ADMIN → Quản lý tài khoản**, tạo hoặc mời nhân viên mới phải tích chọn RNS, Báo cáo hoặc cả hai. **Không có mặc định được vào cả hai.**
- Dòng tài khoản có nút **PHÂN QUYỀN 2 ỨNG DỤNG** để bật/tắt từng quyền và chọn vai trò tương ứng. Tùy chọn **THU HỒI CẢ HAI QUYỀN** giữ nguyên tài khoản/mật khẩu và dữ liệu.
- Nút **XÓA TÀI KHOẢN** yêu cầu gõ đúng email và xác nhận hai lần. Backend bảo vệ ADMIN và dùng kiểm tra khóa ngoại để không xóa người có dữ liệu nghiệp vụ liên quan. Với tài khoản có lịch sử, hãy thu hồi hai quyền thay vì xóa.
- Người thao tác phải đồng thời là ADMIN của cả RNS và Báo cáo khi sửa hai quyền hoặc xóa tài khoản chung.
- **HDSD:** [HDSD_MANAGER_V3.26.md](HDSD_MANAGER_V3.26.md). SQL bảo vệ dữ liệu: `server/v326-shared-account-delete-check.sql`.

# BAOCAOMANAGERONDUTY — SAGS CXR · V3.10

Ứng dụng báo cáo **dự báo điều hành khai thác D+1**. Mục tiêu: từ lịch bay ngày hôm trước, dự báo các khung chồng lấn, hạn chế bãi/đường công vụ, nguồn lực và hàng hóa; đưa ra phương án phòng ngừa **ngắn gọn, có căn cứ**, đúng trách nhiệm từng đơn vị.

## Thiết kế V3.00

- Giao diện mới `v300-workspace.js` và `v300-workspace.css`: Tổng quan → Lịch bay → Cập nhật theo phòng → Phân tích nguy cơ → Báo cáo TGĐ; Cấu hình định mức và Xe giao ca là công cụ phụ, không thuộc luồng nhập liệu thường ngày.
- Một ngày khai thác; mỗi phòng có một giao diện nhập tập trung và một nút **XÁC NHẬN & GỬI ĐIỀU HÀNH**. Xác nhận chỉ áp dụng phần dữ liệu được nhập; ô trống không đồng nghĩa 0 hoặc đủ.
- Quân số theo vai trò và ca lưu ở `ops_staff_capacity`; ghi chú phòng và trạng thái xác nhận ở `ops_unit_forecasts`; GSE ở `ops_gse_capacity`/`ops_gse_issues`; booking Kho hàng ở `ops_warehouse_cargo_plan`. Không tạo bộ dữ liệu ngành dọc song song, không chép thông tin chuyến từ lịch vào các biểu mẫu phòng.
- Định mức phục vụ tối thiểu theo hãng/tàu/công đoạn được lưu riêng ở `ops_minimum_service_norms`, nhập một lần, chỉ được dùng khi có xác nhận. Thiếu một phần định mức, năng định hoặc quân số = **CHỜ XÁC NHẬN**, không suy diễn đủ.
- Dùng lịch bay Lần 1 làm nền; sau khi có Lần 2 thì cập nhật bãi đỗ và những thay đổi thực sự. Báo cáo Lần 2 giữ **mẫu 5 mục từ Lần 1**, bảng kiểm soát 10 nội dung, xuất Word/PDF. Bảng nhân sự ca riêng trong báo cáo đã bỏ.
- Trên trang Tổng quan luôn có nút CTA **XEM BÁO CÁO TGĐ**, trên phần Phân tích có nút CTA **XEM BẢN DỰ BÁO**, và trên trang phòng có CTA **XÁC NHẬN & GỬI ĐIỀU HÀNH**.
- Để bảo vệ dữ liệu và khả năng xuất báo cáo, phiên bản V3.00 **giữ cơ chế đăng nhập RNS/Supabase, bộ nhập lịch, bộ báo cáo và phần xuất file đã được kiểm chứng** dưới lớp tương thích. Những giao diện nhập trùng, mục Nhân sự/GSE tách rời và trình bày Lần 2 dài dòng không còn thuộc luồng chính. Không xóa bảng dữ liệu hoặc tài liệu lịch sử.

## Hướng dẫn sử dụng nhanh

1. **Đăng nhập:** sử dụng tài khoản RNS như cũ; số phiên bản hiển thị góc tài khoản.
2. **Lịch bay:** tải Excel của ngày D+1 để lập Lần 1; sau khi có bãi đỗ cập nhật Lần 2. Các cách nhập thủ công/đối chiếu chỉ mở khi cần.
3. **Các phòng:** chọn đúng phòng (PVSĐ, PVHK, Kho hàng, Điều hành, QA/IT). Nhập quân số thực có theo vai trò và ca, thiết bị hạn chế hoặc booking/ghi chú riêng nếu có. Người có quyền chỉ chỉnh đơn vị phụ trách, hoặc ĐH/ADMIN chỉnh hỗ trợ.
4. **Tham khảo hôm trước:** nút sao chép chỉ điền vào ô đang trống để tham khảo, **không tự lưu hay xác nhận**. Người dùng cần kiểm tra số liệu trước khi xác nhận ngày mới.
5. **Không có ngoại lệ mới:** đánh dấu ô này khi đã rà soát mà không có ngoại lệ ngoài dữ liệu đã lưu. Việc này không tự xác nhận quân số hay định mức còn thiếu.
6. **Phân tích nguy cơ:** hệ thống ưu tiên chồng lấn 30 phút, khu vực bãi 2–3, chuyến quay đầu ngắn, thiết bị hỏng/hạn chế và thiếu CO/bốc xếp/lái GSE khi có đầy đủ định mức + quân số xác nhận. Nguồn chưa xác nhận không được dùng làm kết luận đủ.
7. **Báo cáo TGĐ:** chọn tạo bản xem trước, rà soát Lần 1/Lần 2 và xuất Word hoặc PDF bằng tài khoản ĐH/ADMIN. Lần 2 chỉ bổ sung nhận định ở mục liên quan.
8. **Cấu hình định mức:** chọn hãng, thân rộng/thân hẹp và đơn vị; nhập định mức tối thiểu khi được xác nhận. Các con số VJ mẫu chỉ là gợi ý, chưa tự lưu.
9. **CTA:** các nút hành động quan trọng ở Tổng quan, Phân tích và màn hình đơn vị vẫn được giữ; không có module độc lập tên `CTA` được xác định trong mã nguồn phiên bản trước.

## Nguyên tắc nghiệp vụ quan trọng

- Một cặp đến–đi là **một cặp khai thác** khi phân tích chồng lấn, không cộng thành hai cặp.
- Thời lượng phục vụ quy ước: VJ/9G/VU/AK/FD 30 phút; hãng Hàn Quốc 60 phút; hãng khác theo lịch. Không tự coi STD là thời điểm GSE đã sẵn sàng cho chuyến kế tiếp.
- Khu 1: bãi 31–37, 51–55; khu 2: bãi 38–42; khu 3: bãi 56–71. PVSĐ chủ động chuẩn bị xe, người và phối hợp ATC đối với luồng đường công vụ theo quy trình; ĐH cập nhật AOC và phối hợp chung.
- Chuyến charter có ký hiệu `##`; Điều hành xác nhận yêu cầu riêng với hãng, thông tin tới PVSĐ/Kho khi liên quan.
- Hàng đi chỉ phân tích sau khi Kho xác nhận booking/khối lượng; các trường trống là **chờ xác nhận**, không phải 0.
- Không giả định việc chia sẻ nhân sự giữa check-in, boarding, bốc xếp hoặc lái xe khi chưa có cửa sổ công đoạn và khả năng di chuyển đã xác nhận.
- Báo cáo là dự báo trước ngày khai thác; không trình bày giả định như kết quả khai thác thực tế.

## Kỹ thuật và kiểm chứng

- Trang chạy tại `https://sagsdieuhanh-gif.github.io/BAOCAOMANAGERONDUTY/`.
- Mã nguồn triển khai nằm trên nhánh `main`, có thể xem lịch sử Git để quay lại V2.31 khi cần.
- Kiểm chứng của tác giả: cú pháp JavaScript, phép tính thử về thiếu 01 CO cho 05 cặp VJ với 04 CO, bản xem trước báo cáo đồng cấu trúc 5 mục. Kiểm thử giao diện đăng nhập + lưu dữ liệu trực tiếp bằng tài khoản thật cần được thực hiện trước khi vận hành chính thức.

## V3.01 – Bố cục thống nhất trên PC và mobile
- **Mọi thiết bị có cùng kiểu hiển thị:** thanh chức năng theo chiều dọc **bên trái** và khu vực làm việc **bên phải**. Không chuyển thành thanh menu ngang ở màn hình điện thoại; người dùng chọn và điều hướng các mục như nhau.
- PC: sidebar đủ tên chức năng và mô tả. Tablet: sidebar hẹp vừa. Mobile: thanh trái thu gọn còn 82 px (màn rất nhỏ: 74 px), hiển thị biểu tượng kèm tên ngắn, các phòng nằm trong nhóm CÁC PHÒNG, công cụ phụ trong nhóm CÔNG CỤ PHỤ.
- Thanh công cụ trái cuộn riêng khi có nhiều mục, nội dung phải cuộn dọc và bảng dài được cuộn ngang **bên trong bảng**, không bắt toàn trang cuộn ngang. Khi in, thanh công cụ ẩn để giữ nội dung báo cáo.
- CTA và toàn bộ luồng Lịch bay → Các phòng → Phân tích nguy cơ → Báo cáo TGĐ, quyền xem/nhập và xuất Word/PDF **giữ nguyên**.

## V3.02 – Gửi thư mời qua Supabase Auth
- Trong **QUẢN LÝ TÀI KHOẢN**, gửi thư mời qua `sagscxr-radar-register` chỉ được ghi là **Supabase đã tiếp nhận yêu cầu**, không thể khẳng định email đã đến Inbox. Nếu chưa nhận, vào SAGSCXR-RNS → QUẢN LÝ TÀI KHOẢN → CHỜ XÁC MINH → LẤY LINK MỜI để tạo link kích hoạt và chia sẻ riêng qua email/Zalo.
- Edge Function `sagscxr-radar-register` đã cập nhật redirect sang `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html`, thay URL Vercel cũ; bảo toàn cấp quyền RNS Viewer/Radar và quy trình đăng nhập Supabase.
- Cấu hình SMTP chuyên dụng và nhật ký email provider cần được kiểm tra để xác nhận chuyển phát tự động; không được báo đã gửi thành công chỉ dựa vào HTTP 200 của Auth.

## V3.03 – Đăng ký trực tiếp và phân quyền tại thời điểm tạo
- ADMIN mở **CÔNG CỤ PHỤ → QUẢN LÝ TÀI KHOẢN → TẠO TÀI KHOẢN MỚI**.
- Nhập email, họ tên, quyền Manager/Radar (VIEWER, DH, KTS, PVHK, KHO, QA, IT), quyền RNS (VIEWER; EDITOR chỉ khi người tạo đồng thời là ADMIN RNS) và xác nhận email đã được kiểm tra.
- Backend `sagscxr-radar-register` action `create` dùng `auth.admin.createUser` và cùng Auth RNS, đồng thời ghi `ops_members` + `sags_docs_members`. Không thể tự cấp Manager ADMIN qua form này. Email tồn tại bị từ chối, không ghi đè tài khoản cũ.
- Mật khẩu tạm 20 ký tự được tạo ngẫu nhiên ở máy chủ, chỉ trả về sau khi hoàn tất hai bảng quyền và chỉ hiển thị trên phiên thao tác hiện tại. Không lưu bản rõ trong Firestore/Database/browser storage, không gửi email tự động. ADMIN phải chuyển riêng cho nhân viên.
- Tài khoản mới phải **đăng nhập RNS trước** và đổi mật khẩu tạm theo luồng bắt buộc. Manager không cho truy cập nghiệp vụ khi `rns_must_change_password` còn hiệu lực. Sau khi đổi thành công, một email/mật khẩu dùng được trên cả hai hệ thống.
- GỬI EMAIL MỜI vẫn giữ như phương án phụ, không bắt buộc để đăng ký. Danh sách đã có vẫn có chức năng cấp/chỉnh quyền Manager riêng mà không thay đổi quyền RNS.

## V3.04 – Khôi phục NHẬP NHÂN SỰ XE GIAO CA

**Lỗi:** V3.00–V3.03 chỉ mở bản xem trước/xuất của mục `Xe giao ca`. Bảng nhập số người theo từng giờ xe vẫn ở các tab phòng cũ đã ẩn, làm mất đường thao tác trong giao diện mới.

**Đã khắc phục:**
1. Sau đăng nhập, chọn **XE GIAO CA** trực tiếp từ thanh chức năng **bên trái** trên cả PC và điện thoại (không còn nằm trong nhóm CÔNG CỤ PHỤ).
2. Ngay trên cùng màn hình hiển thị **BẢNG NHẬP TRỰC TIẾP THEO GIỜ XE** theo cả hai chiều **Nha Trang → CXR** và **CXR → Nha Trang**, tiếp theo là khối **XEM TRƯỚC / XUẤT ẢNH PNG, PDF**.
3. Nhập **số người** trong cột được phân quyền, sau đó chọn **LƯU TẤT CẢ THAY ĐỔI**. Các cột phòng khác chỉ xem; ĐH/ADMIN được cập nhật theo phân quyền đã có.
4. Ô trống = chưa xác nhận, 0 = đã xác nhận không có người; giờ lưu lấy từ máy chủ. Mốc xe mặc định, các giờ tự thêm và lý do bổ sung theo cơ chế hiện hành, không tự thay đổi định mức xe.
5. Ngày khai thác lấy từ ngày được chọn chung ở đầu website; khi mở mục XE GIAO CA sẽ tự tải bảng xác nhận hiện hành. Không nhập lại vào bảng nhân sự phục vụ tàu bay.
6. Sau khi lưu, bản xem trước và xuất PNG/PDF tiếp tục dùng đúng dữ liệu xe giao ca đã lưu. Quyền xuất bản vẫn thuộc Điều hành/ADMIN.
7. Dữ liệu `ops_shift_transport_v2`, `ops_shift_transport_rows`, các RPC, quy tắc bảo mật hiện có được giữ nguyên; chỉ khôi phục đường dẫn tới giao diện nhập.

**Phạm vi:** Đây là sửa lỗi hiển thị của V3.03. Các module nghiệp vụ và báo cáo D+1 khác giữ nguyên.

## V3.05 – Tự sắp xếp giờ xe bổ sung

- Trong **XE GIAO CA → THÊM GIỜ XE KHÁC**, sau khi nhập giờ chạy và lý do rồi bấm THÊM MỐC GIỜ, hệ thống **tự chèn dòng theo thứ tự tăng dần của giờ xe**, không đưa giờ tự thêm xuống cuối bảng.
- Ví dụ chiều xe có **10:00** và **16:30**, thêm giờ **11:00** thì bảng nhập hiển thị **10:00 → 11:00 → 16:30**. Mỗi chiều xe sắp xếp riêng. Nhiều xe cùng giờ có dòng bổ sung nằm ngay dưới mốc chính.
- Giờ xe hiển thị theo thứ tự đồng hồ HH:MM của từng chiều xe, từ sớm đến muộn; mã phút lưu gốc vẫn giữ nguyên bao gồm các mốc qua ngày.
- Sau khi thêm, giao diện tự tải lại và đưa người dùng đến dòng vừa chèn để nhập số người; không cần tải lại trang thủ công. Các ô chưa xác nhận không tự coi là 0.
- Bản xem trước và xuất **PNG/PDF** dùng đúng bộ sắp xếp chung với màn hình nhập, bảo đảm cùng thứ tự giờ. Phân quyền theo phòng, quy tắc xe 29/45 chỗ, mốc xe và dữ liệu Supabase không thay đổi.
- Kiểm thử hồi quy mới: `tests/v305-shuttle-chronology.test.cjs` cho trường hợp 10:00, 11:00, 16:30, xe bổ sung cùng giờ và qua ngày.

## V3.06 – Khôi phục phần gợi ý loại xe 29/45 chỗ trực quan

**Lý do:** Bảng nhập xe giao ca trong V3.04/V3.05 có gợi ý xe tại **cột cuối**, nhưng trên màn hình mobile phải cuộn ngang mới thấy; nếu bốn đơn vị chưa xác nhận đủ, cột đó chưa có hình xe, khiến người dùng tưởng mất chức năng.

**Cách sử dụng:**
1. Vào mục **XE GIAO CA** ở menu bên trái. Ngay trước bảng nhập từng chiều, hệ thống hiển thị **🚌 GỢI Ý XE THEO GIỜ** và hình minh họa hai loại xe **29 chỗ/45 chỗ**.
2. Đối với các mốc đã có đủ 4 đơn vị ĐH, PVHK, PVSĐ và QA/IT xác nhận số người, bảng gợi ý hiển thị ngay **giờ xe → hình xe → số lượng ×N → loại xe/ghế dư**. Ví dụ tổng 60 người, gợi ý theo bộ tối ưu hiện có là **01 xe 45 chỗ + 01 xe 29 chỗ**. Các mốc không đủ xác nhận ghi rõ còn chờ; hình 29/45 ở phần đầu chỉ là danh mục minh họa, không phải lệnh điều xe.
3. Người dùng có thể cuộn ngang bảng để xem cột **GỢI Ý XE** như trước. Phần gợi ý bên trên được thiết kế để xem được trên PC và mobile **không cần vuốt ngang**.
4. Khi thêm giờ xe mới, mốc đó được tự chèn đúng thứ tự. Sau khi lưu đủ số liệu của cả 4 phòng, gợi ý tự xuất hiện trong bản xem trước/xuất PNG/PDF theo đúng thứ tự.
5. Các gợi ý chỉ mang tính dự kiến, quyết định loại và số xe triển khai thuộc Phòng Điều hành. Không thay đổi dữ liệu lịch xe, quy tắc gợi ý 29/45 chỗ, quyền sửa, cơ chế xác nhận, xuất PNG/PDF hay cấu hình Supabase.

**Kiểm thử:** `tests/v305-shuttle-chronology.test.cjs` và `tests/v306-shuttle-vehicle-recommendations.test.cjs` bảo vệ thứ tự giờ, hình xe, số xe và không suy đoán khi thiếu xác nhận.

## V3.07 – Sửa tận gốc thứ tự giờ xe và tối giản bảng

- Bảng XE GIAO CA sắp tăng dần theo **giờ chạy nhìn thấy** (giờ/phút, không phải khóa phút +1440 lưu trong database). Chiều **CXR → NHA** mặc định **02:00 → 08:15 → 16:30 → 18:30**; thêm 11:00 thành **02:00 → 08:15 → 11:00 → 16:30 → 18:30**. Chiều **NHA → CXR** mặc định **07:00 → 17:30 → 19:30**; giờ mới chèn đúng vị trí.
- Với các mốc chuẩn, hiển thị **08:15** và **02:00**, không gắn dấu (+1); **không thay đổi giá trị `departure_min`** hay dữ liệu đã lưu.
- Bảng chỉ còn **GIỜ CHẠY | ĐH | PVHK | PVSĐ | QA/IT | TỔNG | GỢI Ý XE**; chữ giờ chạy, tổng người và hình 29/45 chỗ được làm nổi bật. Bỏ các dòng xác nhận, ngày giờ và lý do lặp xen giữa các mốc.
- Mục **Quản lý giờ bổ sung** được thu gọn để sửa lý do và xóa xe đã thêm khi cần; giữ phân quyền và chức năng lưu.
- Gợi ý 29/45 chỗ theo từng giờ hiện phía trên bảng, kể cả giờ đang chờ 4 phòng xác nhận; giờ chưa đủ số liệu phải ghi **CHỜ XÁC NHẬN**, không tự suy đoán loại xe.
- Hiển thị bảng giờ chuẩn ngay cả trước khi Supabase trả dữ liệu; nếu lỗi truy vấn sẽ thông báo cụ thể. Trên màn hình mới, chọn **+ THÊM GIỜ XE** theo chiều → nhập giờ/lý do → bấm THÊM MỐC GIỜ → nhập quân số ở dòng được chèn → LƯU TẤT CẢ THAY ĐỔI. PNG/PDF dùng cùng thứ tự.
- Kiểm thử `tests/v307-shuttle-compact-order.test.cjs` kiểm tra chuỗi **02:00 → 08:15 → 10:00 → 11:00 → 16:30 → 18:30**, bố cục một dòng/giờ, hình xe, phân quyền và khả năng xuất.

## V3.10 – Gợi ý xe tính theo số người THỰC TẾ, không dùng hình minh họa sai chuyến

- Thuật toán tính từ tổng **số người đã nhập cho đúng giờ xe**; không gợi ý xe có tổng sức chứa nhỏ hơn số người. Quy tắc: 1–29 người → 1 xe 29; 30–45 → 1 xe 45; 46–74 → 1 xe 45 + 1 xe 29 (không ưu tiên 2 xe 29), 75–90 → 2 xe 45. Với nhiều người hơn, tiếp tục chọn số xe ít nhất, tránh dùng nhiều xe 29 nếu có phối hợp 45 phù hợp và đảm bảo đủ chỗ.
- **Bỏ 4 thẻ ví dụ cố định 20/40/50/60** trên màn hình XE GIAO CA, vì dễ gây hiểu nhầm hình xe 29 chỗ là gợi ý cho một chuyến thực tế có 40+ người. Thay bằng gợi ý theo từng mốc giờ ngay trên bảng với số người và loại xe tương ứng.
- **Phần trên của ảnh xuất PNG/PDF** chỉ hiển thị *tối đa 4 mốc xe thực tế có số người*, ưu tiên mốc đông người nhất. Mỗi thẻ: giờ xe, tổng số người, loại/số lượng xe với hình đúng. Mốc khác vẫn đầy đủ gợi ý trong ô giờ xe bên dưới. Nếu không có số người, không hiển thị hình xe minh họa sai; ghi rõ chưa nhập số người.
- Khi chưa có đủ 4 phòng, gợi ý hiển thị **TẠM TÍNH** dựa trên số người đã nhập, không cộng ô trống thành 0. Khi đủ 4/4 phòng và đã lưu, hiển thị **GỢI Ý**. Đây là phương án sức chứa, không xác nhận xe thật khả dụng hoặc lệnh điều xe.
- Các mốc giờ chuẩn đã cập nhật V3.08 vẫn giữ nguyên: NHA→CXR 07:00,17:30,19:30; CXR→NHA 08:30,16:30,18:30 trong ngày, 02:00/08:15 ngày hôm sau. Giờ bổ sung tiếp tục tự chèn đúng vị trí và cùng thứ tự trên ảnh xuất.
- Kiểm thử `tests/v310-shuttle-capacity-match.test.cjs` quét số người 0–180, đảm bảo sức chứa đủ, đồng thời kiểm tra 42 người = xe 45, 50 người = 45+29 và hình minh họa xuất lấy đúng số người của chuyến thật.


### V3.11 · Báo cáo D+1 và xe giao ca nhập gọn

- Dữ liệu lịch bay, cao điểm, bãi đỗ và charter được tự lấy từ nguồn ngày khai thác; phòng ban chỉ bổ sung quân số, thiết bị/hàng hóa có xác nhận, ngoại lệ và phương án.
- Kho hàng nhập nhiều chuyến có booking xác nhận trên cùng một bảng, lưu cùng lúc; các thông tin không xác nhận để trống, không coi bằng 0.
- Xe giao ca: bảng nhập chỉ có giờ, 4 phòng và tổng; không hiển thị ảnh/gợi ý xe. Hình xe trên ảnh PNG/PDF thu nhỏ. CXR→NHA có 16:30, 18:30, 02:00 và 08:15 ngày hôm sau; không có chuyến 08:30 trong ngày.
- Hướng dẫn cập nhật: [HDSD_MANAGER_V3.11.md](HDSD_MANAGER_V3.11.md).

### V3.12 · Phân công PVHK đúng công đoạn

- Báo cáo Lần 1/Lần 2: PVHK gồm **quầy làm thủ tục check-in, gate/boarding, đón khách chuyến đến và tiễn khách chuyến đi tại tàu bay**. Phương án diễn đạt theo lịch chuyến, giờ cao điểm và nguồn nhân sự xác nhận, không thu gọn thành chỉ “đón, tiễn khách”.
- Xem [HDSD_MANAGER_V3.12.md](HDSD_MANAGER_V3.12.md) để biết quy tắc diễn giải và các trường hợp cao điểm/đổi giờ/bãi.


### V3.13 · PDF báo cáo A4 dọc

- Xuất PDF báo cáo trên **A4 dọc**, có lề in, cỡ chữ gọn và bảng tự xuống dòng; bảng dài lặp lại tiêu đề khi chuyển trang, không làm mất nội dung. Xuất Word và PDF ảnh xe giao ca giữ nguyên cơ chế riêng.
- Hướng dẫn chi tiết: [HDSD_MANAGER_V3.13.md](HDSD_MANAGER_V3.13.md).


### V3.14 – Quân số đã nhập được đưa vào báo cáo

- ĐH/PVHK/PVSĐ đã xác nhận số người: báo cáo Lần 1 và Lần 2 tải trực tiếp từ `ops_staff_capacity` theo ngày, có bảng quân số từng vị trí và ca sáng/đêm. Trạng thái chưa đánh giá đủ/thiếu không làm mất số người đã nhập; không cộng trùng các nhóm PVSĐ.
- Chi tiết: [HDSD_MANAGER_V3.14.md](HDSD_MANAGER_V3.14.md).


### V3.15 – Báo cáo quân số và PDF có tùy chọn ẩn cảnh báo

- Quân số chỉ nêu số người thực tế theo ca/vị trí; không phán đoán đủ/thiếu theo định mức.
- Tích **“Ẩn thông tin chưa xác nhận khi xuất PDF”** để không đưa khối cảnh báo GSE/Kho hàng chờ xác nhận vào PDF. Bản xem trước và Word giữ nguyên nội dung; bỏ tích để đưa cảnh báo trở lại PDF.
- Xem [HDSD_MANAGER_V3.15.md](HDSD_MANAGER_V3.15.md).


### V3.16 · Dự báo Lần 2 tự dựng bản nhận định hoàn chỉnh

- Sau khi **DUYỆT VÀ LƯU LẦN 2**, hệ thống tự làm mới báo cáo và workspace từ dữ liệu đã lưu; giữ nguyên Lần 1 đối chiếu.
- Đầy đủ 10 mục, bố trí theo khu bãi thực tế, booking/PVHK, KG Kho hàng, quân số các phòng và ghi chú PVSĐ; không cắt câu, không chèn thông tin thiếu dạng chung chung, không suy đoán boarding hoặc đánh giá đủ/thiếu người.
- Chi tiết: [HDSD_MANAGER_V3.16.md](HDSD_MANAGER_V3.16.md).


### V3.17 – Quân số PVSĐ gọn trong một ô

- Màn hình PVSĐ hiện **một ô tóm tắt** gồm PVSĐ, PVHLNG, BỐC XẾP PVSĐ, SKYONE theo sáng/đêm; mục nhập chi tiết mặc định đóng sau khi đã lưu, vẫn mở được để sửa các nhóm GSE/Cobus và các nhóm khác.
- Báo cáo Lần 1/Lần 2 và bản Word/PDF hiện đúng **một ô PVSĐ**, không còn nhiều hàng cho từng nhóm; không cộng trùng quân số.
- [HDSD_MANAGER_V3.17.md](HDSD_MANAGER_V3.17.md).


### V3.18 – Bảng quân số tách 2 ô ca sáng/ca tối

- ĐH, PVHK, PVSĐ hiển thị **mỗi phòng một hàng, hai cột CA SÁNG | CA TỐI** trong báo cáo Lần 1/Lần 2. PVHK gộp Đội đến + Đội đi trong từng ô; PVSĐ gộp Tổng PVSĐ + PVHLNG + Bốc xếp PVSĐ + SKYONE trong từng ô. Không cộng trùng, không xóa dữ liệu.
- Màn hình PVHK/PVSĐ cũng có hai ô theo ca và mục **Nhập / chỉnh sửa quân số chi tiết** thu gọn sau khi đã lưu.
- Chi tiết tại [HDSD_MANAGER_V3.18.md](HDSD_MANAGER_V3.18.md).


### V3.19 – Tổng nhân sự ĐH, biên tập báo cáo L1/L2 và hồ sơ tài khoản
- Phòng ĐH nhập tổng quân số theo ca; Điều phối/CO là nhóm chức năng riêng.
- Biên tập lại nhận định/phương án theo cặp chuyến, STA/STD, 30 phút cao điểm, bãi đỗ, GSE, booking đã xác nhận; tách rõ nguy cơ và trách nhiệm nghiệp vụ.
- ADMIN có chức năng sửa thông tin, quyền Manager và reset mật khẩu tạm ngẫu nhiên dùng chung với RNS.
- [HDSD_MANAGER_V3.19.md](HDSD_MANAGER_V3.19.md).


### V3.20 – Nhân sự PVHK/PVSĐ theo tổ/đội, booking Kho Hàng hai chiều
- PVHK và PVSĐ có biểu mẫu ca sáng/ca tối theo nhóm thực tế; HLSĐ/HLNG tách SKO, PVTT tách TC và SKO. Báo cáo L1/L2 và PDF/Word dùng cùng nguồn.
- Kho Hàng nhập booking ở hai bảng **đi/đến**, chọn KG/TẤN cho từng dòng, tự cộng riêng theo chiều; dữ liệu cũ không bị viết đè.
- Chi tiết: [HDSD_MANAGER_V3.20.md](HDSD_MANAGER_V3.20.md).


### V3.21 – Báo cáo Ban TGĐ: rõ việc, rõ nguy cơ, rõ trách nhiệm

- Kiểm tra 6 bản báo cáo Lần 1/Lần 2 của **31/10, 01/11, 02/11/2026** theo dữ liệu Supabase đã lưu.
- Thay bảng 10 nội dung 4 cột đặc chữ bằng các khối 2 cột: **Nhận định → Phương án → Đơn vị thực hiện**; dàn hàng thẳng, có khoảng cách, hỗ trợ màn hình nhỏ và bản xuất Word/PDF. Chỉnh cả phần cao điểm, phối hợp và các thẻ nhận định trên workspace.
- **Không hiển thị** đoạn chú thích “Nguồn: quân số xác nhận…” và dòng nguồn tên file “Nguồn Lần 2: Book4.xlsx…” trong báo cáo trình Ban TGĐ. Dữ liệu nguồn vẫn được giữ để kiểm tra khi cần.
- Bộ lời nhận định/phương án mới dùng bãi, cặp chuyến, giờ khai thác, booking và GSE đã xác nhận; nhận diện cờ charter/ferry mâu thuẫn để yêu cầu xác minh thay vì khẳng định hai loại hình; không thay lời ĐH đã duyệt.
- [HDSD_MANAGER_V3.21.md](HDSD_MANAGER_V3.21.md).


### V3.22 – Báo cáo trình BGĐ gọn ~2 trang A4

- Giữ lời nhận định V3.21, đưa bảng 10 nội dung trở lại 3 cột gọn, tương tự cách trình bày cũ; thu nhỏ khoảng cách và tối ưu PDF/Word A4 dọc, không cắt dữ liệu để ép số trang.
- `##` chỉ xác định charter: các chuyến vẫn phục vụ bình thường, không phát cảnh báo hay mặc định ferry do ký hiệu này.
- [HDSD_MANAGER_V3.22.md](HDSD_MANAGER_V3.22.md).
