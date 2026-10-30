# HDSD — SAGS-CXR Radar / Báo cáo V2.9

## Phân tách chức năng
1. **BÁO CÁO TGĐ**: giữ đúng cấu trúc báo cáo V2.7, gồm 5 mục: I. Tóm tắt khai thác; II. Bảng kiểm soát; III. Cảnh báo cao điểm theo bảng; IV. Phối hợp thực hiện; V. Kiến nghị Ban TGĐ. Không nhúng biểu đồ Radar chi tiết hoặc bảng xe giao ca vào bản tin chính.
2. **BÁO CÁO RADAR**: tab riêng. Gồm Radar 30 phút tổng hợp cả ngày, các đợt có từ 4 cặp chuyến trở lên, cảnh báo ngay dưới Radar của từng đợt, bảng cặp chuyến và tổng hợp cảnh báo.
3. **XE GIAO CA**: tab riêng, vẫn tổng hợp 5 đơn vị và có nút xuất PNG / PDF độc lập.

## Xuất Word và PDF
- Chọn **Ngày khai thác**, nhập Excel và lưu nguồn lịch Lần 1 theo quy trình V2.7. Sau khi lưu lịch có bãi đỗ, có thể xem Radar Lần 2 trong tab riêng.
- Tại tab **BÁO CÁO TGĐ**, bấm **XEM TRƯỚC / TẢI LẠI SỐ LIỆU** rồi chọn **XUẤT WORD BẢN TIN (.DOCX)** hoặc **XUẤT PDF BẢN TIN (.PDF)**. Hai file được dựng từ cùng nội dung xem trước V2.7, bao gồm các phần đã xác minh và nhãn CHỜ XÁC NHẬN.
- Tại tab **BÁO CÁO RADAR**, chọn **XUẤT WORD RADAR (.DOCX)** hoặc **XUẤT PDF RADAR (.PDF)**. Hai file độc lập với báo cáo TGĐ.
- Tại tab **XE GIAO CA**, dùng **XUẤT ẢNH PNG** hoặc **XUẤT PDF XE GIAO CA**.
- Chỉ tài khoản **ĐH/ADMIN** có quyền xuất/phát hành. Các bộ phận còn lại truy cập báo cáo theo quyền hiện có.
- Cơ chế Word/PDF mới viết tệp trực tiếp từ trình duyệt, **không còn bắt buộc tải docx.js, jsPDF hoặc html2pdf.js từ CDN**. PDF xe giao ca phân trang nếu bảng quá dài.
- Nếu không tải được file, đọc thông báo lỗi hiển thị bên cạnh nút, kiểm tra quyền, tình trạng lịch Lần 1 và các kết nối dữ liệu. Không coi nút báo đang tải là xuất thành công.

## Quy tắc Radar giữ nguyên
- Ghép đến–đi thành **1 cặp khai thác**. Các hãng VJ, 9G, VU, AK, FD: **30 phút**; hãng Hàn Quốc: **60 phút**; các hãng khác theo thời gian lịch.
- Quét khung 30 phút trượt mỗi 5 phút; ngưỡng **ít nhất 4 cặp** chỉ để chọn các đợt được phân tích chi tiết.
- Bãi K1: 31–37, 51–55; K2: 38–42; K3: 56–71. Khu 2/3 là yếu tố rà soát tuyến di chuyển; không mặc nhiên kết luận giao thông bị chặn.
- Số liệu không có nguồn phải ghi CHỜ XÁC NHẬN; không tự suy đoán GSE rảnh khi tới STD.

## Kiểm thử
- CI kiểm tra cú pháp JavaScript và bộ test V2.8/V2.9 khi cập nhật nhánh main.
- Kiểm thử tự động đối chiếu định dạng đầu ra DOCX/ZIP, PDF, cấu trúc nội dung và việc tách các tab. Cần thêm bước kiểm nghiệm bằng tài khoản vận hành thật và mở file thực tế trên Word/Acrobat/điện thoại trước khi chốt nghiệm thu.
