-- ============================================================
-- BillPro MySQL / phpMyAdmin Database Schema & Initial Data
-- Compatible with XAMPP (MySQL / MariaDB)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `billpro` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `billpro`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `plan_type` VARCHAR(50) NOT NULL DEFAULT 'trial',
  `trial_start` DATETIME NOT NULL,
  `trial_end` DATETIME NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `amount_paid` DECIMAL(10,2) DEFAULT 0.00,
  `payment_date` DATETIME DEFAULT NULL,
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `transaction_id` VARCHAR(255) NOT NULL UNIQUE,
  `payment_method` VARCHAR(100) DEFAULT 'UPI / Card',
  `status` VARCHAR(50) DEFAULT 'completed',
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Company Settings Table
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `company_name` VARCHAR(255) NOT NULL DEFAULT 'My Business',
  `tagline` VARCHAR(255) DEFAULT NULL,
  `works_address` TEXT,
  `address` TEXT,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `state_code` VARCHAR(10) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `gstin` VARCHAR(50) DEFAULT NULL,
  `pan` VARCHAR(50) DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `bank_branch` VARCHAR(255) DEFAULT NULL,
  `account_no` VARCHAR(100) DEFAULT NULL,
  `ifsc_code` VARCHAR(50) DEFAULT NULL,
  `account_holder` VARCHAR(255) DEFAULT NULL,
  `invoice_prefix` VARCHAR(50) DEFAULT 'INV-',
  `next_invoice_no` INT DEFAULT 1,
  `default_gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `terms_conditions` TEXT,
  `footer_text` TEXT,
  `logo_url` TEXT,
  `signature_url` TEXT,
  `signature_title` VARCHAR(100) DEFAULT 'Proprietor',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `address` TEXT,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `state_code` VARCHAR(10) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Customer GST Numbers Table (Supports Multiple GSTs per Customer)
CREATE TABLE IF NOT EXISTS `customer_gst_numbers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `gst_number` VARCHAR(50) NOT NULL,
  `branch_name` VARCHAR(255) DEFAULT NULL,
  `state_name` VARCHAR(100) DEFAULT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`customer_id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Products / Items Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) DEFAULT NULL,
  `description` TEXT,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(50) DEFAULT 'Nos',
  `gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `hsn_sac` VARCHAR(50) DEFAULT NULL,
  `stock_qty` DECIMAL(12,2) DEFAULT 100.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `customer_gst_id` INT DEFAULT NULL,
  `selected_gst_number` VARCHAR(50) DEFAULT NULL,
  `invoice_number` VARCHAR(100) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `in_dc_no` VARCHAR(100) DEFAULT NULL,
  `in_dc_date` DATE DEFAULT NULL,
  `out_dc_no` VARCHAR(100) DEFAULT NULL,
  `out_dc_date` DATE DEFAULT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_address` TEXT,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `customer_city` VARCHAR(100) DEFAULT NULL,
  `customer_state` VARCHAR(100) DEFAULT NULL,
  `customer_state_code` VARCHAR(10) DEFAULT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `sgst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `igst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_gst` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount_in_words` TEXT,
  `payment_status` VARCHAR(50) DEFAULT 'unpaid',
  `payment_mode` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT,
  `terms` TEXT,
  `image1_url` TEXT,
  `image2_url` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  INDEX (`customer_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Invoice Items Table
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `item_no` INT DEFAULT 1,
  `description` TEXT NOT NULL,
  `sq_ft` DECIMAL(12,2) DEFAULT 0.00,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(50) DEFAULT 'Nos',
  `rate` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `gst_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX (`invoice_id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Invoice & Company Uploaded Images Table
CREATE TABLE IF NOT EXISTS `invoice_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `invoice_id` INT DEFAULT NULL,
  `invoice_id_or_user_id` INT DEFAULT NULL,
  `image_slot` INT DEFAULT 1,
  `image_type` VARCHAR(50) DEFAULT 'general',
  `file_path` TEXT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT DEFAULT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Default Initial Seed Data (Admin Login: admin@billpro.com / admin123)
-- ============================================================

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`)
VALUES (1, 'Admin User', 'admin@billpro.com', '$2b$10$QWHcgTzKn6yrGTvLgJoXBuVapLKrR7tfXPwJ3u1wbHgSsA/MpH3aK', '9371101561', 'admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

INSERT INTO `subscriptions` (`user_id`, `plan_type`, `trial_start`, `trial_end`, `status`, `amount_paid`)
VALUES (1, 'trial', NOW(), DATE_ADD(NOW(), INTERVAL 29 DAY), 'active', 0.00)
ON DUPLICATE KEY UPDATE `status` = 'active';

INSERT INTO `company_settings` (
  `user_id`, `company_name`, `tagline`, `works_address`, `address`, `city`, `state`, `state_code`, `pincode`,
  `phone`, `email`, `website`, `gstin`, `pan`, `bank_name`, `bank_branch`, `account_no`, `ifsc_code`, `account_holder`,
  `invoice_prefix`, `next_invoice_no`, `default_gst_rate`, `terms_conditions`, `footer_text`, `signature_title`
) VALUES (
  1,
  'Vaishali Industries',
  'POWDER COATING SPECIALISTS',
  'Works : Sr.NO ; 25/3 Nanded Phata Near Savali Dhaba\nSinhgad Road , Pune - 411 041\nTel : 9371101561',
  'Sinhgad Road, Pune - 411041',
  'Pune',
  'Maharashtra',
  '27',
  '411041',
  '9371101561',
  'contact@vaishaliindustries.com',
  'www.vaishaliindustries.com',
  '27AAACV1234F1Z5',
  'CDBPB8308N',
  'Janata Sahakari Bank Ltd.',
  'Sinhagad Road , Pune',
  '037230100003478',
  'JSBP0000037',
  'Vaishali Industries',
  'INV-',
  119,
  18.00,
  '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within due date.\n3. Subject to Pune jurisdiction.',
  'Thank you for your business!',
  'Proprietor'
) ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

INSERT INTO `customers` (`id`, `user_id`, `name`, `contact_person`, `phone`, `email`, `address`, `city`, `state`, `state_code`, `pincode`, `notes`)
VALUES (1, 1, 'Kalsons Fabricators & Engineers', 'Rajesh Kulkarni', '9822001122', 'accounts@kalsons.com', 'Plot No. 44, Hadapsar Industrial Estate', 'Pune', 'Maharashtra', '27', '411013', 'Long-time industrial fabrication partner')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `customer_gst_numbers` (`customer_id`, `gst_number`, `branch_name`, `state_name`, `is_default`)
VALUES
(1, '27ABCDE1234F1Z5', 'Pune Head Office & Works', 'Maharashtra', 1),
(1, '24ABCDE1234F1Z9', 'Gujarat Assembly Depot', 'Gujarat', 0)
ON DUPLICATE KEY UPDATE `gst_number` = VALUES(`gst_number`);

INSERT INTO `products` (`id`, `user_id`, `name`, `sku`, `description`, `price`, `unit`, `gst_rate`, `hsn_sac`, `stock_qty`)
VALUES
(1, 1, 'Powder Coating - Matt Black', 'PC-BLK-01', 'Epoxy polyester powder coating with pre-treatment', 4.50, 'Sq.Ft', 18.00, '9988', 5000.00),
(2, 1, 'Sheet Metal Fabrication Assembly', 'SM-FAB-10', 'Industrial grade mild steel enclosure sheet metal work', 5294.00, 'Nos', 18.00, '7326', 150.00),
(3, 1, 'CNC Laser Cutting Service', 'CNC-LC-05', 'High precision laser cutting up to 12mm thickness', 850.00, 'Pcs', 18.00, '9988', 200.00)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 7-Day Trial Demo Account (Login: trial7@billpro.com / trial123)
-- ============================================================

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`)
VALUES (2, '7-Day Trial User', 'trial7@billpro.com', '$2b$10$5R51aVjiFWOBlKVMNr.QxOGxVI5M9NfDC42zTB.th0LPL/R19tAni', '9876543210', 'admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

INSERT INTO `subscriptions` (`user_id`, `plan_type`, `trial_start`, `trial_end`, `status`, `amount_paid`)
VALUES (2, 'trial_7d', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active', 0.00)
ON DUPLICATE KEY UPDATE `status` = 'active';

INSERT INTO `company_settings` (
  `user_id`, `company_name`, `tagline`, `works_address`, `address`, `city`, `state`, `state_code`, `pincode`,
  `phone`, `email`, `website`, `gstin`, `pan`, `bank_name`, `bank_branch`, `account_no`, `ifsc_code`, `account_holder`,
  `invoice_prefix`, `next_invoice_no`, `default_gst_rate`, `terms_conditions`, `footer_text`, `signature_title`
) VALUES (
  2,
  '7-Day Trial Enterprise',
  '7-DAY ACCESS DEMO',
  'Works Address Line 1, Industrial Area\nPune - 411001',
  'Business Park, Pune',
  'Pune',
  'Maharashtra',
  '27',
  '411001',
  '9876543210',
  'trial7@billpro.com',
  'www.trial7.com',
  '27ABCDE1234F1Z5',
  'ABCDE1234F',
  'HDFC Bank',
  'Main Branch',
  '50200012345678',
  'HDFC0001234',
  '7-Day Trial Enterprise',
  'INV-',
  1,
  18.00,
  '1. Valid for 7-day trial demo.\n2. Invoices and customer data are removed once the 7 days expire.',
  'Thank you for testing BillPro!',
  'Proprietor'
) ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);
