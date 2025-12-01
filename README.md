# K SHOPPING - E-COMMERCE WEBSITE (Node.js Final Project)

**Môn học:** Lập trình Web với Node.js (502070)
**Giảng viên:** ThS. Dương Hữu Phước

## 1\. THÔNG TIN NHÓM

| STT | Họ và Tên | MSSV | Vai trò |
|---|---|---|---|
| 1 | **Bùi Duy Kha** | 52300032 | Fullstack, DevOps (Docker, CI/CD), AI Features |
| 2 | **Bùi Minh Khải** | 52300033 | Backend, Database, Frontend UI |

-----

## 2\. TRIỂN KHAI PUBLIC (DEPLOYMENT)

Dự án đã được deploy công khai trên nền tảng Cloud để phục vụ việc chấm điểm nhanh.

  * **Public URL:** [https://kshop-live-website.onrender.com](https://kshop-live-website.onrender.com)
  * **Hạ tầng:** Render.com (Web Service) + MongoDB Atlas (Database) + Redis Cloud (Cache/Queue).

### Tài khoản Đăng nhập (Pre-loaded Data):

**1. Tài khoản ADMIN (Quyền quản trị):**

  * **Email:** `admin@kshop.com`
  * **Mật khẩu:** `123456`
  * *Chức năng:* Truy cập Dashboard, Quản lý Sản phẩm, Đơn hàng, Người dùng, Mã giảm giá.

**2. Tài khoản CUSTOMER (Khách hàng):**

  * **Email:** `customer@kshop.com`
  * **Mật khẩu:** `123456`
  * *Chức năng:* Đặt hàng, Xem lịch sử, Đánh giá sản phẩm.

### GHI CHÚ QUAN TRỌNG

**1. Về tính năng gửi Email (SMTP):**

  * Hệ thống Email (Đăng ký, Quên mật khẩu, Xác nhận đơn hàng) hoạt động **hoàn hảo 100% trên môi trường Local (Docker)**.
  * Tuy nhiên, trên môi trường **Public Cloud (Render/Railway)**, do chính sách bảo mật của Google (chặn các dải IP Hosting miễn phí) nên kết nối SMTP đến Gmail thường xuyên bị **Timeout**.
      * *Trên Cloud:* Web vẫn báo thành công (để không gián đoạn trải nghiệm), nhưng email có thể không đến.
      * *Trên Local:* Email gửi/nhận bình thường.

**Về ElasticSearch trên Cloud:**

  * Do giới hạn RAM của gói Free Hosting, dịch vụ ElasticSearch đã được tắt trên môi trường Cloud (Render). Tính năng tìm kiếm trên Cloud sẽ tự động chuyển về tìm kiếm cơ bản (MongoDB).
  * Tính năng tìm kiếm nâng cao và AI Image Search hoạt động đầy đủ nhất trên môi trường Docker Local.
-----

## 3\. TÍNH NĂNG BONUS (ĐIỂM THƯỞNG)

Nhóm đã hoàn thành **4/4** tính năng nâng cao theo yêu cầu của đồ án:

1.  **Microservices Architecture:**

      * Hệ thống tách biệt thành các dịch vụ: **App** (Web chính), **Worker** (Xử lý tác vụ nặng nền như gửi Email), **Redis** (Message Queue & Session), **Database**, **ElasticSearch**.
      * Giao tiếp bất đồng bộ qua Redis Queue.

2.  **CI/CD Pipeline:**

      * Tích hợp **GitHub Actions**.
      * Tự động Build Docker Image và Push lên Docker Hub khi có commit vào nhánh `main`.

3.  **ElasticSearch Integration:**

      * Tích hợp **ElasticSearch** để tìm kiếm sản phẩm tốc độ cao (Full-text search).
      * Hỗ trợ tìm kiếm mờ (Fuzzy search) và gợi ý từ khóa (Live Search).

4.  **AI Features (Google Gemini):**

      * **Chatbot thông minh:** Hỗ trợ tìm kiếm sản phẩm và tra cứu trạng thái đơn hàng bằng ngôn ngữ tự nhiên.
      * **Sentiment Analysis:** Tự động phân tích cảm xúc (Tích cực/Tiêu cực) của bình luận đánh giá và gắn nhãn.
      * **Image Search (AI Vision):** Cho phép tìm kiếm sản phẩm bằng cách upload hình ảnh.

-----

## 4\. HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL (DOCKER) 🛠️

### Yêu cầu:

  * Docker Desktop đã được cài đặt và đang chạy.
  * Git.

### Bước 1: Clone và Chuẩn bị

```bash
# 1. Giải nén file zip hoặc clone repo
cd web_nodejs

# 2. Đảm bảo file .env đã có đầy đủ thông tin (File .env mẫu đã được đính kèm trong source)
# Lưu ý: Kiểm tra key GEMINI_API_KEY và SMTP_PASS trong file .env
```

### Bước 2: Build & Deploy Stack

Mở terminal tại thư mục gốc dự án:

```bash
# 1. Build Image (Bắt buộc để cập nhật code mới nhất)
docker build -t duykh4/kshop-app:latest .

# 2. Khởi tạo Swarm (Nếu chưa từng làm)
docker swarm init

# 3. Triển khai Stack
docker stack deploy -c docker-compose.yml kshop_stack
```

### Bước 3: Nạp dữ liệu mẫu (Seed Data)

Sau khi các container đã chạy (khoảng 30s), chạy lệnh sau để nạp dữ liệu vào MongoDB và đồng bộ sang ElasticSearch:

```bash
# 1. Lấy ID của container app
docker ps | grep kshop_stack_app

# 2. Chạy seed (Thay CONTAINER_ID bằng ID tìm được ở trên)
docker exec -it <CONTAINER_ID> node seeders/catalog.seed.js
# Ví dụ: docker exec -it kshop_stack_app.1.xxxxx node seeders/catalog.seed.js
```

*Log thành công sẽ hiện: `✅ Đồng bộ thành công...`*

### Bước 4: Truy cập

  * **Website:** http://localhost (Cổng 80)
  * **Admin Dashboard:** http://localhost/admin

-----

**Xin cảm ơn Thầy đã xem xét dự án của nhóm\!**