-- ============================================================
--  Karunada Collection — MySQL Database Schema
--  Database: ecommerce_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- ============================================================
--  1. USERS TABLE
--     Stores registered customer & admin accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id     BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    phone       VARCHAR(15),
    password    VARCHAR(255)    NOT NULL,           -- BCrypt hash
    role        ENUM('USER','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    active      TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  2. CUSTOMER DETAILS TABLE
--     Extended profile / saved addresses for customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_details (
    customer_id         BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    full_name           VARCHAR(150),
    alternate_phone     VARCHAR(15),
    date_of_birth       DATE,
    gender              ENUM('Male','Female','Other'),
    -- Default shipping address
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    country             VARCHAR(50)     DEFAULT 'India',
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (customer_id),
    UNIQUE  KEY uq_customer_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  3. PRODUCTS TABLE
--     Clothing catalogue
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    product_id      BIGINT          NOT NULL AUTO_INCREMENT,
    product_name    VARCHAR(200)    NOT NULL,
    category        VARCHAR(100),                   -- e.g. Shirts, Jeans, T-Shirts
    brand           VARCHAR(100),
    price           DECIMAL(10,2)   NOT NULL,
    size            VARCHAR(20),                    -- S, M, L, XL, XXL or comma-list
    color           VARCHAR(50),
    stock           INT             NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    description     TEXT,
    gst_rate        DECIMAL(5,2)    GENERATED ALWAYS AS (
                        IF(price > 2500, 18.00, 5.00)
                    ) STORED,                       -- auto GST: 5% ≤2500, 18% >2500
    active          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id),
    INDEX idx_products_category (category),
    INDEX idx_products_price    (price),
    INDEX idx_products_active   (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  4. CART TABLE
--     Active cart items (per user, per product)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
    cart_id     BIGINT  NOT NULL AUTO_INCREMENT,
    user_id     BIGINT  NOT NULL,
    product_id  BIGINT  NOT NULL,
    quantity    INT     NOT NULL DEFAULT 1,
    size        VARCHAR(20),
    color       VARCHAR(50),
    added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (cart_id),
    UNIQUE  KEY uq_cart_user_product (user_id, product_id, size, color),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  5. ORDERS TABLE
--     Order header — one row per order
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    order_id        BIGINT          NOT NULL AUTO_INCREMENT,
    order_ref       VARCHAR(30)     NOT NULL UNIQUE,    -- e.g. ORD-1717600000000
    user_id         BIGINT,                             -- NULL for guest checkout
    -- Customer snapshot at time of order
    customer_name   VARCHAR(150)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    phone           VARCHAR(15)     NOT NULL,
    shipping_address VARCHAR(255)   NOT NULL,
    city            VARCHAR(100)    NOT NULL,
    pincode         VARCHAR(10)     NOT NULL,
    -- Financials
    subtotal        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    gst_amount      DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    shipping_cost   DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(10,2)   NOT NULL,
    -- Payment & status
    payment_method  VARCHAR(50)     NOT NULL,           -- UPI, Cash on Delivery
    payment_status  ENUM('Pending','Paid','Failed') NOT NULL DEFAULT 'Pending',
    status          ENUM('Pending','Confirmed','Shipped','Delivered','Cancelled')
                                    NOT NULL DEFAULT 'Pending',
    -- Delivery OTP
    delivery_otp    VARCHAR(6),
    -- Timestamps
    order_date      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    delivered_at    DATETIME,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Items snapshot (JSON for flexibility)
    items_json      LONGTEXT,

    PRIMARY KEY (order_id),
    INDEX idx_orders_user_id    (user_id),
    INDEX idx_orders_status     (status),
    INDEX idx_orders_order_date (order_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  6. ORDER ITEMS TABLE
--     Line items — one row per product per order
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    item_id         BIGINT          NOT NULL AUTO_INCREMENT,
    order_id        BIGINT          NOT NULL,
    product_id      BIGINT,                             -- NULL if product deleted
    product_name    VARCHAR(200)    NOT NULL,            -- snapshot
    size            VARCHAR(20),
    color           VARCHAR(50),
    quantity        INT             NOT NULL,
    unit_price      DECIMAL(10,2)   NOT NULL,
    gst_rate        DECIMAL(5,2)    NOT NULL,            -- 5 or 18
    gst_amount      DECIMAL(10,2)   NOT NULL,
    line_total      DECIMAL(10,2)   NOT NULL,            -- qty × unit_price

    PRIMARY KEY (item_id),
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  SAMPLE SEED DATA
-- ============================================================

-- ============================================================
--  DEFAULT USER ACCOUNTS  (BCrypt cost 10)
-- ============================================================

-- Default User  |  user@karunada.com  |  Usr#kP9m@3xQ
INSERT IGNORE INTO users (name, email, phone, password, role) VALUES
('Default User', 'user@karunada.com', '8888888888',
 '$2a$10$AzCDr2w6mp5ZlN75heooQ.yxKp07gVL6FcrQ7Zxi5inqZUHNJEGy6', 'USER');

-- Admin  |  admin@karunada.com  |  Adm@8nL5r#7vZ
INSERT IGNORE INTO users (name, email, phone, password, role) VALUES
('Admin', 'admin@karunada.com', '9999999999',
 '$2a$10$48NUVkmfMxv5G7MT2zHaRuQsCQJDPBLL5VCJAtUAmd.ltHMUlqkDS', 'ADMIN');

-- Super Admin  |  superadmin@karunada.com  |  SAdm@7kR#9mXp2
INSERT IGNORE INTO users (name, email, phone, password, role) VALUES
('Super Admin', 'superadmin@karunada.com', '7777777777',
 '$2a$10$FwPhNyieDL5uwg1xAsNTl.Xk1dEaA/uf8EI5kOY9ae.NCz5fyWqzC', 'SUPER_ADMIN');

-- Sample products
INSERT IGNORE INTO products (product_name, category, brand, price, size, color, stock, image_url, description) VALUES
('Classic White Shirt',    'Shirts',   'Karunada', 999.00,  'S,M,L,XL',     'White',  50, 'images/shirt.jpg',  'Premium cotton formal shirt'),
('Slim Fit Jeans',         'Jeans',    'Karunada', 1499.00, '28,30,32,34',  'Blue',   40, 'images/jeans.jpg',  'Comfortable slim fit denim'),
('Linen Casual Shirt',     'Shirts',   'Karunada', 1299.00, 'M,L,XL,XXL',   'Beige',  35, 'images/linen.jpg',  'Breathable linen summer shirt'),
('Graphic T-Shirt',        'T-Shirts', 'Karunada', 599.00,  'S,M,L,XL,XXL', 'Black',  60, 'images/tshirt.jpg', 'Trendy graphic print tee'),
('Premium Kurta',          'Ethnic',   'Karunada', 2799.00, 'M,L,XL',       'Navy',   25, 'images/shirt.jpg',  'Festive wear premium kurta');
