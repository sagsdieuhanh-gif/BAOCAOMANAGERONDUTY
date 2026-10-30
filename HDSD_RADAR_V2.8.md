# Hướng dẫn xuất báo cáo Radar CXR V2.8 (bản thử)

## Phạm vi
- Áp dụng trong **BÁO CÁO TGĐ** tại `/EREPORT/radar-cxr/`. Báo cáo gồm 5 phần nghiệp vụ đang sử dụng, đặt Radar tổng hợp cả ngày ngay ở mục I và mở rộng mục III bằng tất cả **đợt** đạt ngưỡng ít nhất 4 cặp đến–đi trong cửa sổ 30 phút.
- Mỗi cặp khai thác trong một hồ sơ chỉ tính một lần. Phân tích cửa sổ 30 phút dịch mỗi 5 phút. Những cửa sổ từ 4 cặp trở lên kề nhau được gom thành một đợt, tránh nhiều trang lặp.
- Dự báo thời lượng quy ước: VJ/9G/VU/AK/FD: 30 phút; các hãng Hàn Quốc: 60 phút; hãng khác theo lịch. Không đồng nhất thời lượng với ground-time thực tế và không coi STD là mốc GSE đã giải phóng.

## Cách sử dụng
1. Chọn **ngày khai thác** và nhập/kiểm tra Excel lịch bay. Lưu snapshot Lần 1. Sau khi có nguồn AOC và bãi đỗ, nhập và lưu snapshot Lần 2 nếu cần.
2. Các đơn vị PVSĐ, PVHK, Kho, QA/IT cập nhật những dữ liệu thực sự đã xác nhận.
3. Mở tab **BÁO CÁO TGĐ**; nút **XEM TRƯỚC / TẢI LẠI SỐ LIỆU** hiện Radar cả ngày ở phần tổng quan, các đợt cao điểm tại mục III, danh sách cặp chuyến và cảnh báo ngay dưới mỗi Radar.
4. Tài khoản **ĐH/ADMIN** chọn **XUẤT BÁO CÁO WORD · RADAR (.DOCX)** hoặc **XUẤT BÁO CÁO PDF · RADAR (.PDF)**. Tài khoản chỉ xem không được phát hành.
5. Kiểm tra trang đầu, bảng chuyến trong mỗi đợt và phần **TỔNG HỢP CẢNH BÁO TOÀN NGÀY** trước khi gửi Ban TGĐ.

## Quy tắc dữ liệu và cảnh báo
- Ưu tiên snapshot **Lần 2** cho báo cáo nếu có; nếu chưa có thì dùng **Lần 1**. Hiển thị rõ nguồn và số lần dự báo. Không thay thế hay sửa snapshot gốc.
- Khu vực 1: vị trí 31–37, 51–55. Khu vực 2: 38–42. Khu vực 3: 56–71.
- Các chuyến ở khu vực 2/3: cảnh báo cần rà soát tuyến di chuyển; **không mặc nhiên khẳng định đường công vụ đang bị chặn**.
- Cảnh báo tàu thân rộng hoặc cargo chưa xác nhận là yêu cầu kiểm tra tương thích và nguồn lực, **không tự kết luận thiếu**.
- Các dữ liệu chưa có phải ghi **CHỜ XÁC NHẬN**. Nguồn không đủ giờ để tính thời lượng được đếm riêng, không tự tạo thời gian.
- Ngưỡng `>=4` dùng để chọn đợt in chi tiết; bản thân số cặp không chứng minh nguy cơ mức đỏ.
- Biểu đồ tổng hợp dùng 48 mốc nửa giờ, mỗi cột thể hiện mức đỉnh cửa sổ 30 phút trong nửa giờ đó.

## Giới hạn kiểm thử
- Đã kiểm tra cú pháp module và kiểm tra logic mẫu 3/4 cặp, ghép đợt, cảnh báo khu bãi và tàu thân rộng.
- **Chưa có kiểm thử cuối đến cuối trực tiếp bằng tài khoản Supabase và lịch bay vận hành thật trên trình duyệt.** Cần thử tải DOCX, PDF trên Chrome/Edge và điện thoại trước khi dùng chính thức.
- Xuất PDF cần tải thư viện `html2pdf.js` qua CDN; Word cần `docx` qua CDN. Nếu không kết nối thư viện, ứng dụng phải báo lỗi thay vì giả định đã xuất thành công.
- Các phiên bản chỉnh sửa tiếp theo cần cập nhật tài liệu này khi thay đổi tính năng xuất báo cáo.
