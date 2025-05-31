-- Thêm roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON DUPLICATE KEY UPDATE name = 'ROLE_USER';
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON DUPLICATE KEY UPDATE name = 'ROLE_ADMIN';
INSERT INTO roles (name) VALUES ('ROLE_SHIPPER') ON DUPLICATE KEY UPDATE name = 'ROLE_SHIPPER';

-- Thêm vài users mẫu
INSERT INTO users (username, email, password, phone_number, full_name, created_at)
VALUES 
('user1', 'user1@example.com', '$2a$10$TJ1yLp77ri1vRPPLbYma9.yvBRdQrIJqRQD5WJoDT8QYpMrIRHUwK', '0901234567', 'User One', NOW()),
('admin', 'admin@example.com', '$2a$10$TJ1yLp77ri1vRPPLbYma9.yvBRdQrIJqRQD5WJoDT8QYpMrIRHUwK', '0909876543', 'Admin User', NOW()),
('shipper1', 'shipper1@example.com', '$2a$10$TJ1yLp77ri1vRPPLbYma9.yvBRdQrIJqRQD5WJoDT8QYpMrIRHUwK', '0905555555', 'Shipper One', NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Gán roles cho users
INSERT INTO user_roles (user_id, role_id) SELECT (SELECT id FROM users WHERE username = 'user1'), (SELECT id FROM roles WHERE name = 'ROLE_USER') 
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), role_id = VALUES(role_id);

INSERT INTO user_roles (user_id, role_id) SELECT (SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), role_id = VALUES(role_id);

INSERT INTO user_roles (user_id, role_id) SELECT (SELECT id FROM users WHERE username = 'shipper1'), (SELECT id FROM roles WHERE name = 'ROLE_SHIPPER')
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), role_id = VALUES(role_id);

-- Tạo dữ liệu cho bảng Categories (Danh mục sản phẩm)
INSERT INTO categories (name, description, image_url, parent_id, is_active, display_order) VALUES
-- Danh mục chính
('Điện thoại', 'Các loại điện thoại di động', 'https://example.com/images/categories/phone.jpg', NULL, TRUE, 1),
('Laptop', 'Máy tính xách tay các loại', 'https://example.com/images/categories/laptop.jpg', NULL, TRUE, 2),
('Máy tính bảng', 'Các loại máy tính bảng', 'https://example.com/images/categories/tablet.jpg', NULL, TRUE, 3),
('Phụ kiện', 'Phụ kiện công nghệ', 'https://example.com/images/categories/accessories.jpg', NULL, TRUE, 4),
('TV & Thiết bị điện tử', 'Tivi và các thiết bị điện tử', 'https://example.com/images/categories/tv.jpg', NULL, TRUE, 5),

-- Danh mục con của Điện thoại
('Điện thoại iPhone', 'Các dòng điện thoại iPhone', 'https://example.com/images/categories/iphone.jpg', 1, TRUE, 1),
('Điện thoại Samsung', 'Các dòng điện thoại Samsung', 'https://example.com/images/categories/samsung.jpg', 1, TRUE, 2),
('Điện thoại Xiaomi', 'Các dòng điện thoại Xiaomi', 'https://example.com/images/categories/xiaomi.jpg', 1, TRUE, 3),
('Điện thoại Oppo', 'Các dòng điện thoại Oppo', 'https://example.com/images/categories/oppo.jpg', 1, TRUE, 4),

-- Danh mục con của Laptop
('Laptop Apple', 'Máy tính xách tay của Apple', 'https://example.com/images/categories/mac.jpg', 2, TRUE, 1),
('Laptop Dell', 'Máy tính xách tay của Dell', 'https://example.com/images/categories/dell.jpg', 2, TRUE, 2),
('Laptop HP', 'Máy tính xách tay của HP', 'https://example.com/images/categories/hp.jpg', 2, TRUE, 3),
('Laptop Asus', 'Máy tính xách tay của Asus', 'https://example.com/images/categories/asus.jpg', 2, TRUE, 4),
('Laptop Gaming', 'Máy tính xách tay dành cho game thủ', 'https://example.com/images/categories/gaming.jpg', 2, TRUE, 5),

-- Danh mục con của Phụ kiện
('Tai nghe', 'Các loại tai nghe', 'https://example.com/images/categories/headphone.jpg', 4, TRUE, 1),
('Cáp sạc', 'Các loại cáp sạc cho thiết bị', 'https://example.com/images/categories/cable.jpg', 4, TRUE, 2),
('Ốp lưng', 'Ốp lưng bảo vệ điện thoại', 'https://example.com/images/categories/case.jpg', 4, TRUE, 3),
('Pin dự phòng', 'Pin sạc dự phòng', 'https://example.com/images/categories/powerbank.jpg', 4, TRUE, 4);

-- Tạo dữ liệu cho bảng Products (Sản phẩm)
INSERT INTO products (name, description, price, stock, image_url, category_id, average_rating, review_count, sold_count, is_featured, discount_percentage) VALUES
-- Điện thoại iPhone
('iPhone 14 Pro Max', 'iPhone 14 Pro Max 128GB, màn hình 6.7 inch Super Retina XDR, chip A16 Bionic', 28990000, 50, 'https://example.com/images/products/iphone14promax.jpg', 6, 4.8, 120, 200, TRUE, 5.0),
('iPhone 14 Pro', 'iPhone 14 Pro 256GB, màn hình 6.1 inch Super Retina XDR, chip A16 Bionic', 26990000, 45, 'https://example.com/images/products/iphone14pro.jpg', 6, 4.7, 95, 150, TRUE, 3.0),
('iPhone 14', 'iPhone 14 128GB, màn hình 6.1 inch Super Retina XDR, chip A15 Bionic', 19990000, 60, 'https://example.com/images/products/iphone14.jpg', 6, 4.5, 80, 130, FALSE, 2.0),
('iPhone 13', 'iPhone 13 128GB, màn hình 6.1 inch Super Retina XDR, chip A15 Bionic', 17990000, 40, 'https://example.com/images/products/iphone13.jpg', 6, 4.6, 150, 300, FALSE, 10.0),

-- Điện thoại Samsung
('Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23 Ultra 256GB, màn hình 6.8 inch Dynamic AMOLED 2X, chip Snapdragon 8 Gen 2', 25990000, 30, 'https://example.com/images/products/s23ultra.jpg', 7, 4.9, 85, 120, TRUE, 0.0),
('Samsung Galaxy S23', 'Samsung Galaxy S23 128GB, màn hình 6.1 inch Dynamic AMOLED 2X, chip Snapdragon 8 Gen 2', 19990000, 35, 'https://example.com/images/products/s23.jpg', 7, 4.7, 70, 100, FALSE, 5.0),
('Samsung Galaxy A54', 'Samsung Galaxy A54 128GB, màn hình 6.4 inch Super AMOLED, chip Exynos 1380', 9990000, 70, 'https://example.com/images/products/a54.jpg', 7, 4.5, 60, 200, FALSE, 8.0),
('Samsung Galaxy Z Fold4', 'Samsung Galaxy Z Fold4 256GB, màn hình 7.6 inch Dynamic AMOLED 2X, chip Snapdragon 8+ Gen 1', 32990000, 20, 'https://example.com/images/products/zfold4.jpg', 7, 4.8, 40, 50, TRUE, 0.0),

-- Điện thoại Xiaomi
('Xiaomi 13 Pro', 'Xiaomi 13 Pro 256GB, màn hình 6.73 inch AMOLED, chip Snapdragon 8 Gen 2', 21990000, 25, 'https://example.com/images/products/xiaomi13pro.jpg', 8, 4.6, 35, 60, FALSE, 0.0),
('Xiaomi 13', 'Xiaomi 13 128GB, màn hình 6.36 inch AMOLED, chip Snapdragon 8 Gen 2', 17990000, 30, 'https://example.com/images/products/xiaomi13.jpg', 8, 4.5, 30, 50, FALSE, 5.0),
('Xiaomi Redmi Note 12 Pro', 'Xiaomi Redmi Note 12 Pro 128GB, màn hình 6.67 inch AMOLED, chip MediaTek Dimensity 1080', 7990000, 80, 'https://example.com/images/products/redminote12pro.jpg', 8, 4.3, 90, 250, FALSE, 10.0),

-- Laptop Apple
('MacBook Pro 14 M2 Pro', 'MacBook Pro 14 inch M2 Pro 16GB RAM, 512GB SSD', 45990000, 15, 'https://example.com/images/products/macbookpro14.jpg', 10, 4.9, 25, 30, TRUE, 0.0),
('MacBook Air M2', 'MacBook Air M2 8GB RAM, 256GB SSD', 26990000, 20, 'https://example.com/images/products/macbookairm2.jpg', 10, 4.8, 40, 70, TRUE, 5.0),
('MacBook Pro 16 M2 Max', 'MacBook Pro 16 inch M2 Max 32GB RAM, 1TB SSD', 69990000, 10, 'https://example.com/images/products/macbookpro16.jpg', 10, 5.0, 15, 20, FALSE, 0.0),

-- Laptop Gaming
('Asus ROG Strix G15', 'Asus ROG Strix G15 AMD Ryzen 7-6800H, 16GB RAM, RTX 3060, 512GB SSD', 32990000, 18, 'https://example.com/images/products/rogg15.jpg', 14, 4.7, 55, 90, TRUE, 3.0),
('MSI Stealth 15M', 'MSI Stealth 15M Intel Core i7-11375H, 16GB RAM, RTX 3060, 512GB SSD', 28990000, 15, 'https://example.com/images/products/stealth15m.jpg', 14, 4.6, 45, 80, FALSE, 5.0),
('Acer Predator Helios Neo', 'Acer Predator Helios Neo Intel Core i7-12700H, 16GB RAM, RTX 3070Ti, 1TB SSD', 35990000, 12, 'https://example.com/images/products/heliosneo.jpg', 14, 4.8, 30, 50, TRUE, 0.0),

-- Phụ kiện - Tai nghe
('AirPods Pro 2', 'Tai nghe không dây Apple AirPods Pro 2 với công nghệ chống ồn chủ động', 5990000, 50, 'https://example.com/images/products/airpodspro2.jpg', 16, 4.8, 200, 350, TRUE, 0.0),
('Galaxy Buds 2 Pro', 'Tai nghe không dây Samsung Galaxy Buds 2 Pro với công nghệ Hi-Fi 24bit', 3990000, 45, 'https://example.com/images/products/buds2pro.jpg', 16, 4.5, 150, 280, FALSE, 10.0),
('Xiaomi Redmi Buds 4 Pro', 'Tai nghe không dây Xiaomi Redmi Buds 4 Pro với tính năng chống ồn', 1690000, 80, 'https://example.com/images/products/redmibuds4pro.jpg', 16, 4.3, 100, 200, FALSE, 15.0),

-- Phụ kiện - Pin dự phòng
('Anker PowerCore Slim 10000', 'Pin dự phòng Anker PowerCore Slim 10000mAh với công nghệ PowerIQ', 790000, 100, 'https://example.com/images/products/ankerpowercore.jpg', 19, 4.7, 300, 500, TRUE, 5.0),
('Mi Power Bank 3 20000', 'Pin dự phòng Xiaomi Mi Power Bank 3 20000mAh với 2 cổng USB-A và 1 cổng USB-C', 890000, 90, 'https://example.com/images/products/mipowerbank3.jpg', 19, 4.6, 250, 450, FALSE, 10.0),
('Samsung Wireless Powerbank', 'Pin dự phòng Samsung Wireless 10000mAh với khả năng sạc không dây', 1290000, 70, 'https://example.com/images/products/samsungpowerbank.jpg', 19, 4.4, 180, 320, FALSE, 0.0);

-- Tạo dữ liệu cho bảng Product Images (Hình ảnh sản phẩm)
INSERT INTO product_images (product_id, url, is_primary, display_order) VALUES
-- Hình ảnh cho iPhone 14 Pro Max
(1, 'https://example.com/images/products/iphone14promax_1.jpg', TRUE, 1),
(1, 'https://example.com/images/products/iphone14promax_2.jpg', FALSE, 2),
(1, 'https://example.com/images/products/iphone14promax_3.jpg', FALSE, 3),
(1, 'https://example.com/images/products/iphone14promax_4.jpg', FALSE, 4),

-- Hình ảnh cho Galaxy S23 Ultra
(5, 'https://example.com/images/products/s23ultra_1.jpg', TRUE, 1),
(5, 'https://example.com/images/products/s23ultra_2.jpg', FALSE, 2),
(5, 'https://example.com/images/products/s23ultra_3.jpg', FALSE, 3),
(5, 'https://example.com/images/products/s23ultra_4.jpg', FALSE, 4),

-- Hình ảnh cho MacBook Pro 14
(13, 'https://example.com/images/products/macbookpro14_1.jpg', TRUE, 1),
(13, 'https://example.com/images/products/macbookpro14_2.jpg', FALSE, 2),
(13, 'https://example.com/images/products/macbookpro14_3.jpg', FALSE, 3),
(13, 'https://example.com/images/products/macbookpro14_4.jpg', FALSE, 4),

-- Hình ảnh cho Asus ROG Strix G15
(16, 'https://example.com/images/products/rogg15_1.jpg', TRUE, 1),
(16, 'https://example.com/images/products/rogg15_2.jpg', FALSE, 2),
(16, 'https://example.com/images/products/rogg15_3.jpg', FALSE, 3),
(16, 'https://example.com/images/products/rogg15_4.jpg', FALSE, 4),

-- Hình ảnh cho AirPods Pro 2
(19, 'https://example.com/images/products/airpodspro2_1.jpg', TRUE, 1),
(19, 'https://example.com/images/products/airpodspro2_2.jpg', FALSE, 2),
(19, 'https://example.com/images/products/airpodspro2_3.jpg', FALSE, 3); 