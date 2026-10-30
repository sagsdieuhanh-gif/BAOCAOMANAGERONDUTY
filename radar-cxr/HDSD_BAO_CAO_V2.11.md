# HƯỚNG DẪN SỬ DỤNG — SAGS-CXR BÁO CÁO DỰ BÁO V2.11

## 1. Cấu trúc báo cáo theo mẫu tham chiếu 30/10/2026
Báo cáo chính tại tab **BÁO CÁO TGĐ** có 5 phần: I. Tóm tắt khai thác; II. Bảng kiểm soát 10 nội dung; III. Cảnh báo cao điểm 30 phút; IV. Phối hợp thực hiện; V. Kiến nghị Ban TGĐ. Nội dung tàu rộng/chuyến đặc biệt là **mục 03** độc lập.

10 nội dung gồm: 01 Lịch bay và sản lượng; 02 Khung giờ cao điểm; 03 Tàu thân rộng/chuyến đặc biệt; 04 Vị trí đỗ và hạ tầng; 05 Nhân lực khai thác; 06 GSE trọng yếu; 07 Hành lý – hàng hóa; 08 OTP và chất lượng; 09 An toàn – an ninh; 10 Kết quả xử lý tồn tại.

**BÁO CÁO RADAR** (Radar cả ngày và các đợt ≥4 cặp) và **XE GIAO CA** là 2 tab, 2 phần xuất riêng; không chèn các biểu đồ hoặc bảng xe vào báo cáo TGĐ.

## 2. Đầu vào các phòng
Nguồn lịch bay Excel sheet LB, lần dự báo 1/2, so sánh sản lượng, cặp đến–đi, STA/STD, A/C Reg, loại tàu, PAX và vị trí đỗ (khi có) do **ĐH** cập nhật. Không tự tạo mã ghép chuyến hoặc đoán bãi nếu nguồn thiếu.

Nhân sự PVHK và PVSĐ nhập theo các biểu mẫu đã có; **Sky One** chỉ ghi nguồn thực nhận theo khung; **GSE** nhập số khả dụng thực tế và thiết bị hạn chế theo mã; **Kho** ghi KG/PCS, giờ sẵn sàng theo từng chuyến. Không phải nhập lại dữ liệu này trong biểu mẫu mới.

Các thẻ bổ sung **XÁC NHẬN PHỤC VỤ BÁO CÁO** của đơn vị:
- **ĐH:** tình trạng AOC/bãi, chuyến ưu tiên, trình tự điều hành, hạn chế khai thác và nội dung vượt thẩm quyền.
- **PVSĐ/KTSĐ:** trạng thái đáp ứng A330, B777 (sẵn sàng/có hạn chế/chờ xác nhận); GSE, năng định, nhóm tăng cường, phương án phục vụ dứt điểm và điều chuyển cuốn chiếu.
- **PVHK:** trạng thái bố trí nhân lực tàu rộng; kế hoạch đón khách, gate/boarding, hành lý và tăng cường theo cao điểm; yêu cầu khách đặc biệt.
- **Kho Hàng:** ưu tiên bàn giao, hàng đặc thù, điểm nghẽn cargo và yêu cầu GSE/PVSĐ.
- **QA/IT:** bản tin an toàn, thời tiết/FOD đã xác minh, CAPA/tồn tại ca trước, vị trí/chuyến bị ảnh hưởng và biện pháp theo dõi.

Mỗi phòng điền ngắn, chỉ trường có thông tin. Bấm **LƯU NHÁP** khi chưa chốt; bấm **XÁC NHẬN DỮ LIỆU CỦA PHÒNG** khi có căn cứ. Trạng thái nháp **không được** sử dụng làm kết luận đã xác nhận. Dữ liệu chưa nhập hoặc PENDING được trình bày là **CHỜ XÁC NHẬN**.

## 3. Nhận định tự động đa tình huống
Bộ nhận xét dựa trên dữ liệu ngày hiện tại và các phản hồi đã xác nhận; không chọn ngẫu nhiên:
- tăng/giảm sản lượng (chỉ khi có ngày nguồn đã đối chiếu), cơ cấu quốc nội/quốc tế;
- đỉnh 30 phút, ground-time ngắn/sát thời lượng phục vụ, AK/FD và hãng Hàn Quốc trong cao điểm tối khi đúng lịch;
- A330/B777, tải PAX cao từ 300 người/chuyến (mốc gợi ý chú ý, **không khẳng định vượt năng lực**), trạng thái GSE/đội PVHK và giới hạn riêng của loại tàu;
- bãi khu 2/3, thiết bị hạn chế, GSE chưa có số khả dụng;
- cargo dồn khung, KG/PCS/giờ bàn giao, tồn tại/CAPA và thời tiết từ nguồn đã xác nhận.

Chỉ nêu hãng/chuyến có mặt trong nguồn; không mặc định thiết bị tương thích, không coi STD là mốc giải phóng GSE và không suy luận đủ/thiếu người khi chưa có số liệu xác nhận.

## 4. Xuất Word/PDF
Tại **BÁO CÁO TGĐ**, bấm **XEM TRƯỚC / TẢI LẠI**, rà soát dữ liệu, sau đó **XUẤT WORD** hoặc **XUẤT PDF**. Mẫu xuất giữ nguyên 5 mục, 10 hàng kiểm soát và đủ tên các phòng, cùng phần cao điểm, phối hợp, kiến nghị. Định dạng trang ngang, Times New Roman, đường viền đầy đủ, bảng gọn; các trường chờ xác nhận được làm nổi bật. Word có thể sửa nội dung bảng, PDF cố định để gửi.

Tại **BÁO CÁO RADAR** và **XE GIAO CA**, dùng nút xuất riêng.

## 5. Bảo mật dữ liệu và giới hạn nghiệm thu
Bảng `ops_unit_forecasts` dùng RLS: tài khoản có quyền nghiệp vụ đọc; mỗi phòng chỉ ghi dữ liệu của phòng mình; ADMIN có quyền hỗ trợ. Thao tác không ghi đè nguồn lịch bay, GSE, PAX, Cargo; lưu nháp khác với xác nhận.

Đã kiểm thử logic, kiểm tra cú pháp module và cấu trúc tài liệu bằng CI. Phải kiểm tra thực tế Word/PDF, đăng nhập tài khoản từng phòng, RLS và bố cục văn bản đủ 10 mục trước khi nghiệm thu sản xuất.
