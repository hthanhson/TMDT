SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS review_helpful;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS user_balances;
DROP TABLE IF EXISTS balance_transactions;
DROP TABLE IF EXISTS user_points;
DROP TABLE IF EXISTS user_points_transaction;
DROP TABLE IF EXISTS loyalty_tier;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS product_recommendation;
DROP TABLE IF EXISTS refund_requests;
DROP TABLE IF EXISTS refund_request_images;
DROP TABLE IF EXISTS shipment_tracking;
DROP TABLE IF EXISTS VNPayStatus;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SHIPPER') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  email VARCHAR(50) NOT NULL,
  password VARCHAR(120) NOT NULL,
  full_name VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  parent_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_category_name (name),
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DOUBLE NOT NULL,
  stock INT NOT NULL,
  image_url VARCHAR(255),
  category_id BIGINT,
  average_rating DOUBLE DEFAULT 0.0,
  review_count INT DEFAULT 0,
  sold_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  discount_percentage DOUBLE DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  INDEX idx_product_category (category_id),
  INDEX idx_product_name (name),
  INDEX idx_product_price (price),
  INDEX idx_product_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  title VARCHAR(255),
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_review_product (product_id),
  INDEX idx_review_user (user_id),
  INDEX idx_review_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE review_helpful (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  is_helpful BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_helpful_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_helpful_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uk_review_helpful_user (review_id, user_id),
  INDEX idx_review_helpful_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
  maximum_discount DECIMAL(10,2),
  start_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  user_id BIGINT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_coupon_code (code),
  CONSTRAINT fk_coupon_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_coupon_user (user_id),
  INDEX idx_coupon_active (is_active),
  INDEX idx_coupon_dates (start_date, expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_STATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shipping_address TEXT NOT NULL,
  billing_address TEXT,
  phone_number VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'PENDING',
  shipper_id BIGINT,
  shipping_fee DECIMAL(10,2) DEFAULT 0.00,
  estimated_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  tracking_number VARCHAR(100),
  notes TEXT,
  coupon_id BIGINT,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  refund_status ENUM('NONE', 'REQUESTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'NONE',
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE SET NULL,
  INDEX idx_order_user (user_id),
  INDEX idx_order_status (status),
  INDEX idx_order_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name VARCHAR(255),
  product_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  INDEX idx_order_item_order (order_id),
  INDEX idx_order_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipment_tracking (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  created_by BIGINT,
  latitude DOUBLE,
  longitude DOUBLE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_tracking_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  INDEX idx_shipment_tracking_order (order_id),
  INDEX idx_shipment_tracking_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refund_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  additional_info TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refund_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_refund_user (user_id),
  INDEX idx_refund_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refund_request_images (
  refund_request_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  CONSTRAINT fk_refund_image_request FOREIGN KEY (refund_request_id) REFERENCES refund_requests (id) ON DELETE CASCADE,
  INDEX idx_refund_image_request (refund_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
  INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_balances (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_balance_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_balance_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE balance_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_balance_transaction_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_balance_transaction_user (user_id),
  INDEX idx_balance_transaction_type (transaction_type),
  INDEX idx_balance_transaction_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE loyalty_tier (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  minimum_points INT NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  special_perks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_loyalty_tier_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_points INT DEFAULT 0,
  available_points INT DEFAULT 0,
  tier_id BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_points_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_points_tier FOREIGN KEY (tier_id) REFERENCES loyalty_tier (id) ON DELETE SET NULL,
  UNIQUE KEY uk_user_points_user (user_id),
  INDEX idx_user_points_tier (tier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_points_transaction (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  points INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP NULL,
  CONSTRAINT fk_points_transaction_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_points_transaction_user (user_id),
  INDEX idx_points_transaction_type (transaction_type),
  INDEX idx_points_transaction_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  requires_action BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id),
  INDEX idx_notification_type (type),
  INDEX idx_notification_read (is_read),
  INDEX idx_notification_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_recommendation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  recommended_product_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendation_rec_product FOREIGN KEY (recommended_product_id) REFERENCES products (id) ON DELETE CASCADE,
  UNIQUE KEY uk_product_recommendation (product_id, recommended_product_id, type),
  INDEX idx_recommendation_product (product_id),
  INDEX idx_recommendation_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  status ENUM('ACTIVE', 'ENDED') NOT NULL,
  last_message VARCHAR(500),
  unread_count INT DEFAULT 0,
  INDEX idx_chat_session_user (user_id),
  INDEX idx_chat_session_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id VARCHAR(255),
  sender_name VARCHAR(255),
  receiver_id VARCHAR(255),
  sender_type ENUM('USER', 'ADMIN', 'SYSTEM') NOT NULL,
  chat_session_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_chat_message_session FOREIGN KEY (chat_session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
  INDEX idx_chat_message_session (chat_session_id),
  INDEX idx_chat_message_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE VNPayStatus (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(50),
  Message VARCHAR(255),
  url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu
INSERT INTO roles (name) VALUES ('ROLE_USER');
INSERT INTO roles (name) VALUES ('ROLE_MODERATOR');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');
INSERT INTO roles (name) VALUES ('ROLE_SHIPPER');

INSERT INTO loyalty_tier (name, minimum_points, discount_percentage, special_perks) VALUES
('Bronze', 0, 0.00, 'Standard shipping'),
('Silver', 1000, 2.00, 'Free standard shipping'),
('Gold', 5000, 5.00, 'Free expedited shipping, Priority customer service'),
('Platinum', 10000, 10.00, 'Free priority shipping, VIP customer service, Early access to promotions');
