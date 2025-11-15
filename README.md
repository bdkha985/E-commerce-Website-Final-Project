# web_nodejs
# K Shopping - Hướng Dẫn Triển Khai Docker Swarm (Midterm Project)

Tài liệu này cung cấp hướng dẫn để triển khai và chạy ứng dụng web K Shopping bằng Docker Swarm trên máy tính.

## Yêu Cầu Cần Có 🛠️

* **Docker Engine:** Đảm bảo đã cài đặt và khởi chạy Docker trên máy của mình. Có thể tải Docker tại [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
* **Mã Nguồn:** Clone hoặc tải mã nguồn của dự án về máy tính.

---
## Các Bước Triển Khai 🚀

1.  **Di Chuyển Đến Thư Mục Dự Án:**
    Mở terminal (hoặc Command Prompt) và di chuyển đến thư mục gốc của dự án (nơi chứa file `docker-compose.yml` và `Dockerfile`).

    ```bash
    cd /đường/dẫn/đến/dự/án/của/bạn/source
    ```

2.  **Build Docker Image:**
    Build image cho ứng dụng bằng `Dockerfile` đã cung cấp. Image này chứa cả ứng dụng web (`app`) và tiến trình xử lý email (`worker`).

    ```bash
    docker build -t duykh4/kshop-app:latest .
    ```
    * `-t kshop-app:latest`: Đặt tên (tag) cho image là `kshop-app` với phiên bản `latest`.
    * `.`: Chỉ định thư mục hiện tại là ngữ cảnh build.

3.  **Khởi Tạo Docker Swarm (Nếu chưa có):**
    Nếu đây là lần đầu bạn sử dụng Swarm mode trên máy, bạn cần khởi tạo nó. Nếu đã khởi tạo rồi, bạn có thể bỏ qua bước này.

    ```bash
    docker swarm init
    ```
    * Lệnh này biến Docker engine của bạn thành một node quản lý (manager) của Swarm.

4.  **Triển Khai Stack:**
    Sử dụng lệnh `docker stack deploy` cùng với file `docker-compose.yml` để triển khai tất cả các dịch vụ (nginx, các bản sao app, db, redis, worker).

    ```bash
    docker stack deploy -c docker-compose.yml kshop_stack
    ```
    * `-c docker-compose.yml`: Chỉ định file cấu hình.
    * `kshop_stack`: Tên bạn đặt cho stack ứng dụng này.
    * Docker Swarm sẽ đọc file cấu hình và tạo các service, network, volume cần thiết. Quá trình này có thể mất vài phút, đặc biệt là lần đầu.

5.  **Kiểm Tra Trạng Thái Dịch Vụ (Tùy chọn):**
    Bạn có thể kiểm tra xem tất cả các dịch vụ đã khởi động đúng cách chưa:

    ```bash
    docker stack services kshop_stack
    ```
    * Kiểm tra cột `REPLICAS`. Dịch vụ `app` nên hiển thị `3/3`, các dịch vụ khác nên là `1/1`.

6. **Cách thêm seed để xem dữ liệu (Tùy chọn):**
    Tìm tên một container app: Mở terminal và chạy lệnh để xem các container đang chạy:

    ```bash
    docker ps
    ```
    Chạy lệnh docker exec: Sử dụng tên container bạn vừa copy, chạy lệnh sau:
    ``` bash
    docker exec -it <TÊN_CONTAINER_APP_ĐẦY_ĐỦ> node seeders/catalog.seed.js
    ```
---
## Truy Cập Ứng Dụng 🌐

Sau khi stack đã được triển khai và các dịch vụ đang chạy, bạn có thể truy cập ứng dụng K Shopping bằng cách mở trình duyệt web và vào địa chỉ:

**`http://localhost`**

* *Lưu ý:* Truy cập qua cổng 80 (HTTP mặc định), vì Nginx sẽ xử lý định tuyến nội bộ. **Không** sử dụng cổng 8081.

---
## Dừng Ứng Dụng 🛑

Để dừng và xóa tất cả các service, network và container liên quan đến stack, chạy lệnh sau:

```bash
docker stack rm kshop_stack
```

---

## RESET
```
docker stack deploy -c docker-compose.yml kshop_stack
```