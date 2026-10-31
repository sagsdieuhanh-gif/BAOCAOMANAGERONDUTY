# HƯỚNG DẪN BÁO CÁO NHÂN SỰ V3.14

## V3.14 – HIỂN THỊ QUÂN SỐ ĐH, PVHK, PVSĐ TRONG BÁO CÁO (31/10/2026)

- Khi **ĐH, PVHK, PVSĐ** nhập và xác nhận nhân sự tại không gian làm việc, hệ thống lưu từng số người vào **ops_staff_capacity** theo ngày khai thác, đơn vị, vị trí công việc, ca sáng/đêm. Người dùng **không phải nhập lần thứ hai tại mục báo cáo**.
- Chọn **BÁO CÁO TGĐ** hoặc **Báo cáo điều hành D+1 → TẠO/CẬP NHẬT BẢN XEM TRƯỚC**. Báo cáo **Lần 1 và Lần 2** tự đọc lại dữ liệu nhân sự trực tiếp theo đúng ngày trong kho dữ liệu mỗi lần lập/xuất, không dùng bảng nhân sự trong bộ nhớ chưa được làm mới.
- Ngay trong **mục II – Bảng kiểm soát**, sau bảng 10 nội dung có **bảng CHI TIẾT QUÂN SỐ ĐÃ XÁC NHẬN**: ĐH, PVHK, PVSĐ → từng vị trí công việc → ca sáng → ca đêm. Hiển thị đầy đủ trong màn hình, xuất Word, xuất PDF A4 dọc. **0 người là số đã xác nhận**, không được đổi thành trống. Không có dữ liệu cho một ca thì ghi **CHỜ XÁC NHẬN**.
- Phân biệt 2 trạng thái: **ĐÃ XÁC NHẬN QUÂN SỐ** nghĩa là số người thực tế đã được phòng lưu; **CHƯA ĐÁNH GIÁ ĐỦ/THIẾU** nghĩa là chưa có kết luận nhân sự đáp ứng định mức/nhu cầu. Không dùng trạng thái PENDING của đánh giá đủ/thiếu để ẩn số người đã xác nhận.
- Với **PVSĐ**, các nhóm bốc xếp, lái GSE, lái Cobus, SKYONE, hành lý nhà ga là **các con số theo vị trí**; không cộng cơ học thành tổng số người độc lập do có khả năng kiêm nhiệm. Các dòng khung giờ SKYONE đặc biệt không được cộng trùng với số SKYONE ca sáng/đêm trong bảng chính.
- **Nếu dữ liệu không hiển thị**, kiểm tra ngày khai thác đã chọn; nếu báo cáo báo lỗi tải quân số thì kiểm tra kết nối/đăng nhập, không được tự suy đoán rằng các phòng chưa gửi.
- Báo cáo Lần 2 **không được rút ngắn phần nhân sự** để chèn ghi chú check-in, gate, boarding. Nhận định nghiệp vụ riêng vẫn hiển thị tại mục phù hợp.
