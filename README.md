# BAOCAOMANAGERONDUTY — SAGS CXR · V3.00

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
