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
