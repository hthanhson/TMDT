# TMDT Backend

Backend cho ứng dụng thương mại điện tử được phát triển với Spring Boot.

## Cấu trúc

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/example/tmdt/
│   │   │   ├── config/         # Cấu hình Spring Boot
│   │   │   ├── controller/     # REST controllers
│   │   │   ├── model/          # JPA entities
│   │   │   ├── payload/        # DTO objects
│   │   │   ├── repository/     # JPA repositories
│   │   │   ├── security/       # Authentication & authorization
│   │   │   ├── service/        # Business logic
│   │   │   └── TmdtApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── application.yml
│   └── test/
└── pom.xml
```

## Công nghệ sử dụng

- Spring Boot
- Spring Security
- Spring Data JPA
- JWT Authentication
- PostgreSQL
- Lombok

## Cài đặt và chạy

1. Đảm bảo bạn đã cài đặt Java 11 và Maven
2. Cài đặt PostgreSQL và tạo database `tmdt`
3. Cấu hình thông tin database trong file `src/main/resources/application.properties`
4. Mở terminal và chạy:

```
mvn spring-boot:run
```

## API Endpoints

### Authentication
- POST /api/auth/signup - Đăng ký tài khoản mới
- POST /api/auth/signin - Đăng nhập và nhận JWT token

### Products
- GET /api/products - Lấy danh sách sản phẩm
- GET /api/products/{id} - Lấy chi tiết sản phẩm
- GET /api/products/top - Lấy top sản phẩm bán chạy

### Orders
- GET /api/orders - Lấy danh sách đơn hàng của người dùng
- GET /api/orders/{id} - Lấy chi tiết đơn hàng
- POST /api/orders - Tạo đơn hàng mới

### Users
- GET /api/users/me - Lấy thông tin người dùng hiện tại
- PUT /api/users/me - Cập nhật thông tin người dùng 