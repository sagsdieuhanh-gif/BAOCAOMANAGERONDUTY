# QUY CHUẨN BÁO CÁO ĐIỀU HÀNH CXR – V3.21

## Phạm vi kiểm tra
Bộ quy tắc được đối chiếu trực tiếp với ba hồ sơ ngày khai thác gần nhất có đủ hai lần cập nhật: 31/10, 01/11 và 02/11/2026. Mỗi ngày có Lần 1 và Lần 2. Báo cáo dùng cùng dữ liệu chuyến bay trong Supabase hiện tại, **không tự tạo hoặc điều chỉnh dữ liệu nghiệp vụ**.

| Ngày | Lần 2 | Phân bố bãi Lần 2 | Tình huống cần nhận diện |
|---|---|---|---|
| 31/10/2026 | 33 đến / 35 đi / 35 hồ sơ | K1 22, K2 2, K3 11 | Đã có bãi ở Lần 2; nguồn có chuyến QQE530 đồng thời mang cờ charter và ferry, phải kiểm tra lại loại hình |
| 01/11/2026 | 39 đến / 36 đi / 40 hồ sơ | K1 23, K2 6, K3 11 | So với Lần 1 giảm 1 chuyến đến và 1 chuyến đi; 9 booking hàng đi, 17.000 kg; PVSĐ có ghi chú xe kéo đẩy và XINFA |
| 02/11/2026 | 26 đến / 25 đi / 28 hồ sơ | K1 19, K2 0, K3 9 | Có 9 hồ sơ K3; nhân sự PVHK/PVSĐ theo nhóm mới; ghi chú kỹ thuật xe kéo đẩy 430 và XINFA 30704; chưa có booking hàng đi xác nhận |

## Quy chuẩn viết để Ban TGĐ đọc nhanh
1. **Báo cáo đúng bản chất nguồn:** Lần 1 thường chưa có bãi, không viết nguy cơ tại bãi cụ thể; Lần 2 sử dụng đúng bãi, giờ, số hiệu chuyến đã lưu. Chỉ ghép một cặp đến–đi thành một hồ sơ phục vụ, không nhầm với số lượt đến/đi.
2. **Một vấn đề, một vị trí:** Tách **Nhận định** (số liệu, chuyến, thời gian, bãi, ảnh hưởng dự kiến), **Phương án tổ chức phục vụ** (hành động có mục đích) và **Đơn vị thực hiện** (chủ trì/phối hợp). Không lặp cùng một mô tả GSE hoặc nhân sự ở nhiều mục. Khi thay đổi tình huống, nội dung thay đổi theo dữ liệu, không đảo từ ngẫu nhiên.
3. **Cao điểm 30 phút:** Chỉ rõ khung và cặp chuyến; VJ/9G/VU/AK/FD áp dụng 30 phút, các hãng Hàn Quốc áp dụng 60 phút, hãng khác căn cứ STA–STD thực tế. Không tự sử dụng ngưỡng 35 phút cho hãng khác hoặc kết luận GSE rảnh ở STD.
4. **Bãi đỗ:** K1 = 31–37, 51–55; K2 = 38–42; K3 = 56–71. Với K2/K3, **PVSĐ** làm đầu mối liên hệ ATC để nắm trình tự tàu lăn và thực hiện thủ tục xin phép phương tiện đi qua đường công vụ; tập kết trước nhân lực, xe thang và GSE. **ĐH** theo dõi lịch, thông tin bãi và trao đổi với các phòng có liên quan; không chuyển trách nhiệm ATC sang ĐH.
5. **Khách và nhân sự:** Chỉ lấy quân số đã xác nhận theo đơn vị/ca và tổ/đội. Quân số toàn Phòng ĐH không phải số Điều phối. Booking khách là số đặt chỗ, không phải số khách thực đi; không tuyên bố đủ/thiếu nhân sự nếu thiếu cơ sở định mức và phân công công đoạn.
6. **Kho Hàng:** Tách rõ hàng **đi** với hàng **đến**. Booking nhập KG/tấn được lưu dưới kg; không cộng hàng đến vào hàng đi. Lập phương án xếp hàng đi theo booking và ground time; hàng đến là tiếp nhận/dỡ/vận chuyển. Booking dưới 2,5 tấn chỉ áp dụng phương án khi thỏa thuận hãng cho phép; từ 2,5 tấn cần đối chiếu điều kiện phục vụ thực tế. Không gọi PCS hoặc giờ sẵn sàng chưa nhập là thiếu booking KG.
7. **GSE, an toàn, tồn tại:** Chỉ kết luận tình trạng kỹ thuật theo lời PVSĐ xác nhận. Ghi chú có kế hoạch đặt lốp **không đồng nghĩa đã thay lốp**; cho mượn bơm nước **không mặc định xe đã phục hồi hoặc ngưng khai thác**. Tình huống vừa mang cờ ferry vừa charter phải chuyển về **yêu cầu xác minh loại hình** trước khi ban hành phương án.
8. **Báo cáo lãnh đạo:** Bỏ câu rỗng hoặc lời thúc giục chung như “Các phòng chủ động...”. Chỉ nêu kiến nghị cụ thể từ nội dung đã được xác nhận. Nguồn Excel, tên file Book4.xlsx, giải thích cấu trúc nhân sự và chú giải kỹ thuật được lưu nội bộ **nhưng ẩn trên bản xem trước, Word và PDF**.
9. **Giữ quyền biên tập:** Nội dung nhận định/phương án được ĐH duyệt, chỉnh thủ công vẫn ưu tiên tuyệt đối so với phần sinh tự động; cập nhật phiên bản không thay đổi bản ghi nguồn. Thông tin chưa xác nhận không được tự động chuyển sang xác nhận.

## Cải tiến trình bày V3.21
- Phần **II. Nhận định và phương án tổ chức phục vụ** hiển thị từng hạng mục thành khối riêng. Trong mỗi khối, các hàng **Nhận định / Phương án tổ chức phục vụ / Đơn vị thực hiện** thẳng cột, ngắt ý ngắn, có khoảng trắng.
- Phần **III. Khung giờ cần ưu tiên điều phối** và **IV. Phân công phối hợp và mốc kiểm soát** cũng áp dụng bảng hai cột với nội dung xuống dòng, tránh 4 cột chữ nhỏ sát nhau. Bảng quân số giữ ca sáng/tối rõ ràng.
- Trang **Nguy cơ cần chuẩn bị trước ca** chia mô tả nguy cơ và phương án thành hai khối chữ riêng, có phân cách.
- Trên điện thoại không cắt nội dung; PDF A4 dọc và Word giữ đầy đủ chữ và bảng. Người quản lý vẫn có thể mở dữ liệu gốc trong phần nhập/xác nhận; phần nguồn kỹ thuật bị ẩn khỏi báo cáo trình lãnh đạo.

## Kiểm tra trước khi phát hành hằng ngày
ĐH kiểm tra: lịch L1/L2 đã lưu, số lượng đến/đi; các cặp chồng giờ; thay đổi bãi/giờ/gate; số liệu xác nhận từ PVHK/PVSĐ/Kho; thiết bị có hạn chế; các nhận định trọng tâm có chuyến/giờ/bãi cụ thể; bộ phận thực hiện đúng trách nhiệm. Không suy đoán kết quả khai thác thực tế từ lịch kế hoạch.
