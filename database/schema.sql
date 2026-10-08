CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  accent VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(40) NULL,
  instagram VARCHAR(120) NULL,
  email VARCHAR(190) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_category_brand_slug (brand_id, slug),
  CONSTRAINT fk_categories_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id VARCHAR(32) NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  short_description VARCHAR(255) NULL,
  description TEXT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(12,2) NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 3,
  track_stock TINYINT(1) NOT NULL DEFAULT 1,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_brand (brand_id),
  KEY idx_products_category (category_id),
  KEY idx_products_active_featured (active, featured),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(190) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL DEFAULT 'Color',
  value VARCHAR(120) NOT NULL,
  color_hex VARCHAR(20) NULL,
  sku VARCHAR(120) NOT NULL UNIQUE,
  price DECIMAL(12,2) NULL,
  compare_at_price DECIMAL(12,2) NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 2,
  track_stock TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_variants_product (product_id, active, sort_order),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variant_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  variant_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(190) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_variant_images_variant (variant_id, sort_order),
  CONSTRAINT fk_variant_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin','manager','operator') NOT NULL DEFAULT 'manager',
  brand_scope VARCHAR(32) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_brand FOREIGN KEY (brand_scope) REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(24) NOT NULL UNIQUE,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(60) NOT NULL,
  customer_email VARCHAR(190) NULL,
  delivery_type ENUM('shipping','pickup') NOT NULL,
  address VARCHAR(500) NULL,
  notes TEXT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending','confirmed','preparing','ready','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
  reserved_until DATETIME NULL,
  whatsapp_sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_status (status),
  KEY idx_orders_reserved (reserved_until),
  KEY idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id BIGINT UNSIGNED NULL,
  brand_id VARCHAR(32) NOT NULL,
  product_name VARCHAR(190) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  variant_name VARCHAR(80) NULL,
  variant_value VARCHAR(120) NULL,
  variant_sku VARCHAR(120) NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  qty INT NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_items_brand (brand_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_items_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  delta INT NOT NULL,
  balance_after INT NOT NULL,
  reason ENUM('sale_reservation','cancel_restore','expire_restore','manual_adjustment','restock') NOT NULL,
  note VARCHAR(255) NULL,
  actor_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stock_product_created (product_id, created_at),
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_actor FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V4 migration-safe columns for databases created by previous versions.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT UNSIGNED NULL AFTER product_id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(80) NULL AFTER sku;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_value VARCHAR(120) NULL AFTER variant_name;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(120) NULL AFTER variant_value;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS variant_id BIGINT UNSIGNED NULL AFTER product_id;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- V6: richer categories, audit trail and reusable media library.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER slug;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_key VARCHAR(80) NULL AFTER image_url;

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  alt_text VARCHAR(190) NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_media_url (url),
  CONSTRAINT fk_media_admin FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NULL,
  detail_json JSON NULL,
  ip_address VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_created (created_at),
  KEY idx_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V6.1: editorial home banner carousel, manageable from Ronda Admin.
CREATE TABLE IF NOT EXISTS home_banners (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brand_id VARCHAR(32) NULL,
  eyebrow VARCHAR(120) NULL,
  title VARCHAR(190) NOT NULL,
  subtitle VARCHAR(255) NULL,
  image_url VARCHAR(500) NOT NULL,
  cta_label VARCHAR(80) NULL,
  href VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_home_banners_active_order (active, sort_order),
  KEY idx_home_banners_brand (brand_id),
  CONSTRAINT fk_home_banners_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V7: ordering, collections, richer media/banner metadata, FAQ bot and immutable order snapshots.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 9999 AFTER active;
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER featured;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(190) NULL AFTER description;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description VARCHAR(320) NULL AFTER seo_title;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS archived TINYINT(1) NOT NULL DEFAULT 0 AFTER active;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER variant_sku;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width INT UNSIGNED NULL AFTER size_bytes;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height INT UNSIGNED NULL AFTER width;
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS mobile_image_url VARCHAR(500) NULL AFTER image_url;
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS object_position_desktop VARCHAR(80) NOT NULL DEFAULT '50% 50%' AFTER mobile_image_url;
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS object_position_mobile VARCHAR(80) NOT NULL DEFAULT '50% 50%' AFTER object_position_desktop;

CREATE TABLE IF NOT EXISTS faq_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(220) NOT NULL,
  answer TEXT NOT NULL,
  keywords VARCHAR(500) NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_faq_active_order (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V7.1: per-product and per-variant image framing controls.
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_zoom DECIMAL(4,2) NOT NULL DEFAULT 1.08 AFTER image_url;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_position_x TINYINT UNSIGNED NOT NULL DEFAULT 50 AFTER image_zoom;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_position_y TINYINT UNSIGNED NOT NULL DEFAULT 50 AFTER image_position_x;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_blend_mode VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER image_position_y;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_zoom DECIMAL(4,2) NULL AFTER image_url;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_position_x TINYINT UNSIGNED NULL AFTER image_zoom;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_position_y TINYINT UNSIGNED NULL AFTER image_position_x;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_blend_mode VARCHAR(20) NULL AFTER image_position_y;

-- V8: Materos por el Mundo. Datos propios; importación idempotente desde Google My Maps.
CREATE TABLE IF NOT EXISTS materos_locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  city VARCHAR(160) NULL,
  province VARCHAR(160) NULL,
  country VARCHAR(160) NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  brand_id VARCHAR(32) NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'admin',
  source_external_id VARCHAR(190) NULL,
  source_fingerprint VARCHAR(190) NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_materos_source_external (source, source_external_id),
  UNIQUE KEY uniq_materos_fingerprint (source_fingerprint),
  KEY idx_materos_active_order (active, sort_order, id),
  KEY idx_materos_country (country),
  CONSTRAINT fk_materos_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V8.2: Ronda Admin Pro — order timeline, internal notes and stronger admin operations.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_note TEXT NULL AFTER notes;

CREATE TABLE IF NOT EXISTS order_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NOT NULL,
  note VARCHAR(500) NULL,
  actor_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_events_order_created (order_id, created_at),
  CONSTRAINT fk_order_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_events_admin FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- V8.5: precios mayoristas. Migración idempotente y no destructiva.
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER compare_at_price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(12,2) NULL AFTER wholesale_enabled;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_min_qty INT NOT NULL DEFAULT 6 AFTER wholesale_price;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(12,2) NULL AFTER compare_at_price;
