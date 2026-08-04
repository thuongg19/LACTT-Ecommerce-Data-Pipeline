 Tổng quan dự án
Dự án LACTT là một giải pháp toàn diện kết hợp giữa nền tảng thương mại điện tử chuyên kinh doanh mỹ phẩm và hệ thống đường ống phân tích dữ liệu chuyên sâu. Mục tiêu của dự án là số hóa toàn bộ quy trình mua sắm, quản lý kho vận, xử lý đơn hàng, đồng thời cung cấp các báo cáo phân tích trực quan giúp cấp quản lý đưa ra quyết định kinh doanh hiệu quả.

 Tính năng nổi bật
+ Phân hệ Khách hàng: Hỗ trợ tìm kiếm mỹ phẩm, quản lý giỏ hàng, đặt hàng, theo dõi lộ trình vận chuyển và quản lý ví điểm thưởng tích lũy.
+ Phân hệ Quản trị và Vận hành: Cung cấp công cụ quản lý danh mục sản phẩm, kiểm duyệt đơn hàng, quản lý vận hành kho, cấu hình khuyến mãi và đối soát dòng tiền.
+ Phân hệ Dữ liệu: Tự động hóa quy trình trích xuất, làm sạch và biến đổi dữ liệu từ hệ thống vận hành sang kho dữ liệu phục vụ báo cáo phân tích.

 Công nghệ sử dụng
+ Ứng dụng Backend: Java, Servlet, Apache Tomcat, NetBeans IDE.
+ Cơ sở dữ liệu vận hành: MySQL.
+ Đường ống dữ liệu ELT: Python.
+ Xử lý và Mô hình hóa dữ liệu: DuckDB, Local Data Lake.
+ Trực quan hóa dữ liệu: Power BI.

 Kiến trúc luồng dữ liệu
Hệ thống phân tích dữ liệu được xây dựng theo mô hình ELT bao gồm các bước:
+ Trích xuất: Lấy dữ liệu nguyên bản từ cơ sở dữ liệu MySQL và lưu trữ tại tầng dữ liệu thô.
+ Biến đổi: Làm sạch, chuẩn hóa kiểu dữ liệu và xử lý các giá trị thiếu bằng tập lệnh Python, sau đó lưu tại tầng dữ liệu đã xử lý.
+ Mô hình hóa: Sử dụng DuckDB để thiết lập mô hình đa chiều gồm các bảng sự kiện và bảng chiều, lưu trữ tại tầng kho dữ liệu.
+ Trực quan hóa: Kết nối kho dữ liệu với Power BI để xây dựng hệ thống báo cáo giám sát doanh thu, hiệu quả sản phẩm và hàng tồn kho.

 Đóng góp cá nhân
Trong dự án này, tôi đảm nhiệm các vai trò chính liên quan đến phân tích nghiệp vụ, thiết kế hệ thống và xây dựng luồng dữ liệu:
+ Phân tích và thiết kế hệ thống: Khảo sát yêu cầu, xây dựng biểu đồ ca sử dụng, biểu đồ tuần tự và viết tài liệu đặc tả chi tiết các chức năng nghiệp vụ.

+ Thiết kế data pipeline: Xây dựng quy trình luân chuyển dữ liệu từ hệ thống vận hành đến kho dữ liệu phân tích.
+ Trực quan hóa dữ liệu: Trực tiếp thiết kế và xây dựng các bảng điều khiển báo cáo tài chính, doanh thu trên Power BI.
+ Phát triển giao diện quản trị: Xây dựng chức năng bảng điều khiển theo dõi thống kê cho người quản trị hệ thống.

 Hướng dẫn cài đặt
+ Cài đặt cơ sở dữ liệu: Khởi tạo cơ sở dữ liệu trên MySQL và chạy tệp lệnh SQL để thiết lập cấu trúc bảng và nạp dữ liệu mẫu.
+ Khởi chạy ứng dụng Web: Mở mã nguồn bằng phần mềm NetBeans, cấu hình thông tin kết nối cơ sở dữ liệu và triển khai trên máy chủ Tomcat.
+ Cập nhật dữ liệu phân tích: Chạy lần lượt các tập lệnh Python trong thư mục đường ống dữ liệu để trích xuất, làm sạch và mô hình hóa dữ liệu mới nhất.
+ Xem báo cáo: Mở tệp tin Power BI và làm mới dữ liệu để xem các chỉ số kinh doanh được cập nhật.
