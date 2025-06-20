
-- เปิดใช้งานส่วนขยาย UUID หากยังไม่ได้เปิด (Supabase มักจะมีสิ่งนี้)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ฟังก์ชัน Trigger ทั่วไปสำหรับ updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------
-- Table: provinces
-- ---------------------------------
CREATE TABLE provinces (
    id BIGSERIAL PRIMARY KEY,
    name_th VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100) UNIQUE,
    region_id BIGINT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE provinces IS 'ตารางเก็บข้อมูลจังหวัด';
COMMENT ON COLUMN provinces.id IS 'รหัสจังหวัด (PK)';
COMMENT ON COLUMN provinces.name_th IS 'ชื่อจังหวัดภาษาไทย';
COMMENT ON COLUMN provinces.name_en IS 'ชื่อจังหวัดภาษาอังกฤษ';
COMMENT ON COLUMN provinces.region_id IS 'รหัสภูมิภาค (FK อ้างอิงตาราง regions ถ้ามี)';
COMMENT ON COLUMN provinces.created_at IS 'เวลาที่สร้างรายการ';
COMMENT ON COLUMN provinces.updated_at IS 'เวลาที่แก้ไขรายการล่าสุด';

CREATE TRIGGER set_timestamp_provinces
BEFORE UPDATE ON provinces
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for users table (ประเภทข้อมูล Enum สำหรับตาราง users)
-- ---------------------------------
CREATE TYPE user_id_document_type_enum AS ENUM('national_id', 'passport', 'other');
CREATE TYPE user_id_verification_status_enum AS ENUM('not_submitted', 'pending', 'verified', 'rejected', 'resubmit_required');

-- ---------------------------------
-- Table: users
-- ---------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    phone_verified_at TIMESTAMPTZ NULL,
    email_verified_at TIMESTAMPTZ NULL,
    address_line1 VARCHAR(255) NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    province_id BIGINT NULL,
    postal_code VARCHAR(10) NULL,
    profile_picture_url VARCHAR(255) NULL,
    id_document_type user_id_document_type_enum NULL,
    id_document_number VARCHAR(50) NULL,
    id_document_url VARCHAR(255) NULL,
    id_document_back_url VARCHAR(255) NULL,
    id_selfie_url VARCHAR(255) NULL,
    id_verification_status user_id_verification_status_enum DEFAULT 'not_submitted',
    id_verification_notes TEXT NULL,
    id_verified_at TIMESTAMPTZ NULL,
    id_verified_by_admin_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ NULL,
    registration_ip VARCHAR(45) NULL,
    email_verification_token VARCHAR(100) UNIQUE,
    email_verification_token_expires_at TIMESTAMPTZ NULL,
    preferences JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_users_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_verified_by_admin FOREIGN KEY (id_verified_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE users IS 'ตารางเก็บข้อมูลผู้ใช้งานระบบ';
COMMENT ON COLUMN users.id IS 'รหัสผู้ใช้ (PK)';
COMMENT ON COLUMN users.username IS 'ชื่อผู้ใช้ (ถ้ามี)';
COMMENT ON COLUMN users.email IS 'อีเมล (ใช้สำหรับ login)';
COMMENT ON COLUMN users.password_hash IS 'รหัสผ่านที่ถูก HASH แล้ว';
COMMENT ON COLUMN users.first_name IS 'ชื่อจริง';
COMMENT ON COLUMN users.last_name IS 'นามสกุล';
COMMENT ON COLUMN users.phone_number IS 'เบอร์โทรศัพท์';
COMMENT ON COLUMN users.phone_verified_at IS 'เวลาที่ยืนยันเบอร์โทร';
COMMENT ON COLUMN users.email_verified_at IS 'เวลาที่ยืนยันอีเมล';
COMMENT ON COLUMN users.address_line1 IS 'ที่อยู่บรรทัดที่ 1 (ที่อยู่หลักของผู้ใช้, ไม่ใช่ที่อยู่จัดส่ง)';
COMMENT ON COLUMN users.address_line2 IS 'ที่อยู่บรรทัดที่ 2';
COMMENT ON COLUMN users.city IS 'อำเภอ/เขต (ที่อยู่หลัก)';
COMMENT ON COLUMN users.province_id IS 'รหัสจังหวัด (ที่อยู่หลัก, FK)';
COMMENT ON COLUMN users.postal_code IS 'รหัสไปรษณีย์ (ที่อยู่หลัก)';
COMMENT ON COLUMN users.profile_picture_url IS 'URL รูปโปรไฟล์';
COMMENT ON COLUMN users.id_document_type IS 'ประเภทเอกสารยืนยันตัวตน';
COMMENT ON COLUMN users.id_document_number IS 'เลขที่เอกสารยืนยันตัวตน';
COMMENT ON COLUMN users.id_document_url IS 'URL รูปเอกสารหน้าตรง';
COMMENT ON COLUMN users.id_document_back_url IS 'URL รูปเอกสารด้านหลัง (ถ้ามี)';
COMMENT ON COLUMN users.id_selfie_url IS 'URL รูปถ่ายคู่เอกสาร (ถ้ามี)';
COMMENT ON COLUMN users.id_verification_status IS 'สถานะการยืนยันตัวตน';
COMMENT ON COLUMN users.id_verification_notes IS 'หมายเหตุการยืนยันตัวตน (เช่น เหตุผลที่ถูกปฏิเสธ)';
COMMENT ON COLUMN users.id_verified_at IS 'เวลาที่ยืนยันตัวตนสำเร็จ';
COMMENT ON COLUMN users.id_verified_by_admin_id IS 'Admin ที่ทำการยืนยัน (FK to users.id)';
COMMENT ON COLUMN users.is_active IS 'สถานะบัญชี (ใช้งาน/ไม่ใช้งาน)';
COMMENT ON COLUMN users.last_login_at IS 'เวลา login ล่าสุด';
COMMENT ON COLUMN users.registration_ip IS 'IP ที่ใช้สมัครสมาชิก';
COMMENT ON COLUMN users.email_verification_token IS 'Token สำหรับยืนยันอีเมลหลังสมัคร';
COMMENT ON COLUMN users.email_verification_token_expires_at IS 'เวลาหมดอายุของ email_verification_token';
COMMENT ON COLUMN users.preferences IS 'การตั้งค่าส่วนตัวอื่นๆ (เช่น ภาษา, การแจ้งเตือน)';
COMMENT ON COLUMN users.created_at IS 'เวลาที่สร้างบัญชี';
COMMENT ON COLUMN users.updated_at IS 'เวลาที่แก้ไขบัญชีล่าสุด';
COMMENT ON COLUMN users.deleted_at IS 'สำหรับ Soft Delete';

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: admin_users
-- ---------------------------------
CREATE TABLE admin_users (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    granted_by_admin_id BIGINT NULL,
    permissions JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_users_granted_by FOREIGN KEY (granted_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE admin_users IS 'ตารางเก็บข้อมูลผู้ดูแลระบบ';
COMMENT ON COLUMN admin_users.id IS 'รหัส Admin (PK)';
COMMENT ON COLUMN admin_users.user_id IS 'รหัสผู้ใช้ที่เป็น Admin (FK)';
COMMENT ON COLUMN admin_users.granted_by_admin_id IS 'Admin ที่ให้สิทธิ์ (FK to users.id, อาจเป็น system หรือ admin คนอื่น)';
COMMENT ON COLUMN admin_users.permissions IS 'สิทธิ์เฉพาะของ Admin คนนี้ (ถ้ามีการแบ่งระดับ Admin)';
COMMENT ON COLUMN admin_users.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN admin_users.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE TRIGGER set_timestamp_admin_users
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: categories
-- ---------------------------------
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    parent_id BIGINT NULL,
    icon_url VARCHAR(255) NULL,
    image_url VARCHAR(255) NULL,
    sort_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
COMMENT ON TABLE categories IS 'ตารางหมวดหมู่สินค้า';
COMMENT ON COLUMN categories.id IS 'รหัสหมวดหมู่ (PK)';
COMMENT ON COLUMN categories.name IS 'ชื่อหมวดหมู่ (ภาษาหลัก)';
COMMENT ON COLUMN categories.name_en IS 'ชื่อหมวดหมู่ (ภาษาอังกฤษ)';
COMMENT ON COLUMN categories.slug IS 'Slug สำหรับ URL ที่เป็นมิตร';
COMMENT ON COLUMN categories.description IS 'คำอธิบายหมวดหมู่';
COMMENT ON COLUMN categories.parent_id IS 'รหัสหมวดหมู่แม่ (สำหรับ Nested Categories)';
COMMENT ON COLUMN categories.icon_url IS 'URL ไอคอนหมวดหมู่';
COMMENT ON COLUMN categories.image_url IS 'URL รูปภาพหมวดหมู่';
COMMENT ON COLUMN categories.sort_order IS 'ลำดับการแสดงผล';
COMMENT ON COLUMN categories.is_featured IS 'เป็นหมวดหมู่แนะนำหรือไม่';
COMMENT ON COLUMN categories.is_active IS 'สถานะการใช้งานหมวดหมู่';
COMMENT ON COLUMN categories.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN categories.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for products table (ประเภทข้อมูล Enum สำหรับตาราง products)
-- ---------------------------------
CREATE TYPE product_availability_status_enum AS ENUM('available', 'rented_out', 'unavailable', 'pending_approval', 'rejected', 'hidden', 'draft');
CREATE TYPE product_admin_approval_status_enum AS ENUM('pending', 'approved', 'rejected');

-- ---------------------------------
-- Table: products
-- ---------------------------------
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    province_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(270) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    specifications JSONB NULL,
    rental_price_per_day DECIMAL(12, 2) NOT NULL,
    rental_price_per_week DECIMAL(12, 2) NULL,
    rental_price_per_month DECIMAL(12, 2) NULL,
    security_deposit DECIMAL(12, 2) DEFAULT 0.00,
    quantity INT DEFAULT 1,
    quantity_available INT DEFAULT 1,
    availability_status product_availability_status_enum DEFAULT 'draft',
    min_rental_duration_days INT DEFAULT 1,
    max_rental_duration_days INT NULL,
    address_details VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    condition_notes TEXT NULL,
    view_count INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    admin_approval_status product_admin_approval_status_enum DEFAULT 'approved',
    admin_approval_notes TEXT NULL,
    approved_by_admin_id BIGINT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_products_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_approved_by_admin FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE products IS 'ตารางสินค้าให้เช่า';
COMMENT ON COLUMN products.id IS 'รหัสสินค้า (PK)';
COMMENT ON COLUMN products.owner_id IS 'รหัสเจ้าของสินค้า (FK to users.id)';
COMMENT ON COLUMN products.category_id IS 'รหัสหมวดหมู่สินค้า (FK)';
COMMENT ON COLUMN products.province_id IS 'รหัสจังหวัดที่ตั้งสินค้า (FK)';
COMMENT ON COLUMN products.title IS 'ชื่อสินค้า';
COMMENT ON COLUMN products.slug IS 'Slug สำหรับ URL สินค้า';
COMMENT ON COLUMN products.description IS 'รายละเอียดสินค้า';
COMMENT ON COLUMN products.specifications IS 'คุณสมบัติ/สเปคสินค้า (เก็บเป็น JSON)';
COMMENT ON COLUMN products.rental_price_per_day IS 'ราคาเช่าต่อวัน';
COMMENT ON COLUMN products.rental_price_per_week IS 'ราคาเช่าต่อสัปดาห์ (ถ้ามี)';
COMMENT ON COLUMN products.rental_price_per_month IS 'ราคาเช่าต่อเดือน (ถ้ามี)';
COMMENT ON COLUMN products.security_deposit IS 'ค่ามัดจำ';
COMMENT ON COLUMN products.quantity IS 'จำนวนสินค้าทั้งหมดที่มี (สำหรับสินค้าแบบเดียวกันหลายชิ้น)';
COMMENT ON COLUMN products.quantity_available IS 'จำนวนสินค้าที่พร้อมให้เช่า ณ ปัจจุบัน (ควรมี trigger อัปเดตเมื่อมีการเช่า/คืน)';
COMMENT ON COLUMN products.availability_status IS 'สถานะความพร้อมของสินค้า';
COMMENT ON COLUMN products.min_rental_duration_days IS 'ระยะเวลาเช่าขั้นต่ำ (วัน)';
COMMENT ON COLUMN products.max_rental_duration_days IS 'ระยะเวลาเช่าสูงสุด (วัน)';
COMMENT ON COLUMN products.address_details IS 'รายละเอียดที่ตั้งสินค้าเพิ่มเติม (เช่น เขต, ถนน)';
COMMENT ON COLUMN products.latitude IS 'ละติจูด';
COMMENT ON COLUMN products.longitude IS 'ลองจิจูด';
COMMENT ON COLUMN products.condition_notes IS 'หมายเหตุสภาพสินค้า';
COMMENT ON COLUMN products.view_count IS 'จำนวนครั้งที่เข้าชม';
COMMENT ON COLUMN products.average_rating IS 'คะแนนรีวิวเฉลี่ยของสินค้า (ควรมี trigger อัปเดตจากตาราง reviews)';
COMMENT ON COLUMN products.total_reviews IS 'จำนวนรีวิวทั้งหมดของสินค้า (ควรมี trigger อัปเดตจากตาราง reviews)';
COMMENT ON COLUMN products.is_featured IS 'เป็นสินค้าแนะนำหรือไม่';
COMMENT ON COLUMN products.admin_approval_status IS 'สถานะการอนุมัติโดย Admin';
COMMENT ON COLUMN products.admin_approval_notes IS 'หมายเหตุการอนุมัติโดย Admin';
COMMENT ON COLUMN products.approved_by_admin_id IS 'Admin ที่อนุมัติสินค้า (FK to users.id)';
COMMENT ON COLUMN products.created_at IS 'เวลาที่สร้างสินค้า';
COMMENT ON COLUMN products.updated_at IS 'เวลาที่แก้ไขสินค้าล่าสุด';
COMMENT ON COLUMN products.published_at IS 'เวลาที่เผยแพร่สินค้าสู่สาธารณะ';
COMMENT ON COLUMN products.deleted_at IS 'สำหรับ Soft Delete';

CREATE INDEX idx_products_owner_id ON products(owner_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_province_id ON products(province_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_availability_status ON products(availability_status);
CREATE INDEX idx_products_admin_approval_status ON products(admin_approval_status);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: product_images
-- ---------------------------------
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255) NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
COMMENT ON TABLE product_images IS 'ตารางรูปภาพสินค้า (หลายรูปต่อสินค้า)';
COMMENT ON COLUMN product_images.id IS 'รหัสรูปภาพ (PK)';
COMMENT ON COLUMN product_images.product_id IS 'รหัสสินค้า (FK)';
COMMENT ON COLUMN product_images.image_url IS 'URL รูปภาพ';
COMMENT ON COLUMN product_images.alt_text IS 'ข้อความอธิบายรูปภาพ (สำหรับ SEO & Accessibility)';
COMMENT ON COLUMN product_images.is_primary IS 'เป็นรูปภาพหลักหรือไม่';
COMMENT ON COLUMN product_images.sort_order IS 'ลำดับการแสดงผลรูปภาพ';
COMMENT ON COLUMN product_images.uploaded_at IS 'เวลาที่อัปโหลด';
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- ---------------------------------
-- ENUM Types for user_addresses table (ประเภทข้อมูล Enum สำหรับตาราง user_addresses)
-- ---------------------------------
CREATE TYPE user_address_type_enum AS ENUM('shipping', 'billing', 'other');

-- ---------------------------------
-- Table: user_addresses
-- ---------------------------------
CREATE TABLE user_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address_type user_address_type_enum DEFAULT 'shipping',
    recipient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    sub_district VARCHAR(100) NULL,
    district VARCHAR(100) NOT NULL,
    province_id BIGINT NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_addresses_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE RESTRICT
);
COMMENT ON TABLE user_addresses IS 'ตารางที่อยู่สำหรับจัดส่งของผู้ใช้';
COMMENT ON COLUMN user_addresses.id IS 'รหัสที่อยู่ (PK)';
COMMENT ON COLUMN user_addresses.user_id IS 'รหัสผู้ใช้ (FK)';
COMMENT ON COLUMN user_addresses.address_type IS 'ประเภทที่อยู่ (สำหรับจัดส่งสินค้าให้ผู้เช่า)';
COMMENT ON COLUMN user_addresses.recipient_name IS 'ชื่อผู้รับ';
COMMENT ON COLUMN user_addresses.phone_number IS 'เบอร์โทรผู้รับ';
COMMENT ON COLUMN user_addresses.address_line1 IS 'ที่อยู่บรรทัดที่ 1';
COMMENT ON COLUMN user_addresses.address_line2 IS 'ที่อยู่บรรทัดที่ 2';
COMMENT ON COLUMN user_addresses.sub_district IS 'ตำบล/แขวง';
COMMENT ON COLUMN user_addresses.district IS 'อำเภอ/เขต';
COMMENT ON COLUMN user_addresses.province_id IS 'รหัสจังหวัด (FK)';
COMMENT ON COLUMN user_addresses.postal_code IS 'รหัสไปรษณีย์';
COMMENT ON COLUMN user_addresses.is_default IS 'เป็นที่อยู่หลักสำหรับจัดส่งหรือไม่';
COMMENT ON COLUMN user_addresses.notes IS 'หมายเหตุเพิ่มเติมสำหรับที่อยู่นี้';
COMMENT ON COLUMN user_addresses.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN user_addresses.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);

CREATE TRIGGER set_timestamp_user_addresses
BEFORE UPDATE ON user_addresses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for rentals table (ประเภทข้อมูล Enum สำหรับตาราง rentals)
-- ---------------------------------
CREATE TYPE rental_pickup_method_enum AS ENUM('self_pickup', 'delivery');
CREATE TYPE rental_return_method_enum AS ENUM('self_return', 'owner_pickup');
CREATE TYPE rental_status_enum AS ENUM(
    'pending_owner_approval',
    'pending_payment',
    'confirmed',
    'active',
    'return_pending',
    'completed',
    'cancelled_by_renter',
    'cancelled_by_owner',
    'rejected_by_owner',
    'dispute',
    'expired',
    'late_return'
);
CREATE TYPE rental_payment_status_enum AS ENUM('unpaid', 'pending_verification', 'paid', 'failed', 'refund_pending', 'refunded', 'partially_refunded');
CREATE TYPE rental_return_condition_status_enum AS ENUM('as_rented', 'minor_wear', 'damaged', 'lost', 'not_yet_returned');

-- ---------------------------------
-- Table: rentals
-- ---------------------------------
CREATE TABLE rentals (
    id BIGSERIAL PRIMARY KEY,
    rental_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    renter_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_pickup_time TIMESTAMPTZ NULL,
    actual_return_time TIMESTAMPTZ NULL,
    rental_price_per_day_at_booking DECIMAL(12, 2) NOT NULL,
    security_deposit_at_booking DECIMAL(12, 2) NOT NULL,
    calculated_subtotal_rental_fee DECIMAL(12, 2) NOT NULL,
    delivery_fee DECIMAL(12, 2) DEFAULT 0.00,
    late_fee_calculated DECIMAL(12, 2) NULL,
    platform_fee_renter DECIMAL(12, 2) DEFAULT 0.00,
    platform_fee_owner DECIMAL(12, 2) DEFAULT 0.00,
    total_amount_due DECIMAL(12, 2) NOT NULL,
    final_amount_paid DECIMAL(12, 2) NULL,
    owner_payout_amount DECIMAL(12, 2) NULL,
    pickup_method rental_pickup_method_enum NOT NULL,
    return_method rental_return_method_enum NOT NULL,
    delivery_address_id BIGINT NULL,
    rental_status rental_status_enum NOT NULL,
    payment_status rental_payment_status_enum DEFAULT 'unpaid',
    payment_proof_url VARCHAR(255) NULL,
    payment_verified_at TIMESTAMPTZ NULL,
    payment_verified_by_user_id BIGINT NULL,
    return_condition_status rental_return_condition_status_enum DEFAULT 'not_yet_returned',
    notes_from_renter TEXT NULL,
    notes_from_owner_on_return TEXT NULL,
    cancelled_at TIMESTAMPTZ NULL,
    cancelled_by_user_id BIGINT NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rentals_renter FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rentals_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rentals_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rentals_delivery_address FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL,
    CONSTRAINT fk_rentals_payment_verified_by FOREIGN KEY (payment_verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_rentals_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE rentals IS 'ตารางข้อมูลการเช่าสินค้า';
COMMENT ON COLUMN rentals.id IS 'รหัสการเช่า (PK)';
COMMENT ON COLUMN rentals.rental_uid IS 'รหัสอ้างอิงการเช่า (UUID)';
COMMENT ON COLUMN rentals.renter_id IS 'รหัสผู้เช่า (FK to users.id)';
COMMENT ON COLUMN rentals.product_id IS 'รหัสสินค้าที่เช่า (FK)';
COMMENT ON COLUMN rentals.owner_id IS 'รหัสผู้ให้เช่า (FK to users.id, denormalized for easier query)';
COMMENT ON COLUMN rentals.start_date IS 'วันที่เริ่มเช่า';
COMMENT ON COLUMN rentals.end_date IS 'วันที่สิ้นสุดการเช่า (ตามกำหนด)';
COMMENT ON COLUMN rentals.actual_pickup_time IS 'วันและเวลาที่รับสินค้าจริง (ถ้ามีการบันทึก)';
COMMENT ON COLUMN rentals.actual_return_time IS 'วันและเวลาที่คืนสินค้าจริง';
COMMENT ON COLUMN rentals.rental_price_per_day_at_booking IS 'ราคาเช่าต่อวัน ณ เวลาที่จอง';
COMMENT ON COLUMN rentals.security_deposit_at_booking IS 'ค่ามัดจำ ณ เวลาที่จอง';
COMMENT ON COLUMN rentals.calculated_subtotal_rental_fee IS 'ค่าเช่าที่คำนวณได้ (จำนวนวัน x ราคาต่อวัน)';
COMMENT ON COLUMN rentals.delivery_fee IS 'ค่าจัดส่ง (ถ้ามี)';
COMMENT ON COLUMN rentals.late_fee_calculated IS 'ค่าปรับกรณีคืนล่าช้า (ถ้ามี)';
COMMENT ON COLUMN rentals.platform_fee_renter IS 'ค่าธรรมเนียมแพลตฟอร์มฝั่งผู้เช่า';
COMMENT ON COLUMN rentals.platform_fee_owner IS 'ค่าธรรมเนียมแพลตฟอร์มฝั่งผู้ให้เช่า';
COMMENT ON COLUMN rentals.total_amount_due IS 'ยอดรวมที่ต้องชำระเบื้องต้น (ค่าเช่า + มัดจำ + ค่าส่ง + ค่าธรรมเนียมผู้เช่า)';
COMMENT ON COLUMN rentals.final_amount_paid IS 'ยอดรวมที่ชำระจริง (รวมค่าปรับ, อื่นๆ)';
COMMENT ON COLUMN rentals.owner_payout_amount IS 'ยอดเงินที่ผู้ให้เช่าจะได้รับ (หลังหักค่าธรรมเนียม)';
COMMENT ON COLUMN rentals.pickup_method IS 'วิธีการรับสินค้า';
COMMENT ON COLUMN rentals.return_method IS 'วิธีการคืนสินค้า';
COMMENT ON COLUMN rentals.delivery_address_id IS 'ที่อยู่จัดส่ง (FK to user_addresses.id, ถ้า pickup_method = delivery)';
COMMENT ON COLUMN rentals.rental_status IS 'สถานะการเช่า';
COMMENT ON COLUMN rentals.payment_status IS 'สถานะการชำระเงิน';
COMMENT ON COLUMN rentals.payment_proof_url IS 'URL สลิปการโอนเงิน (กรณี Manual Upload)';
COMMENT ON COLUMN rentals.payment_verified_at IS 'เวลาที่ Admin/Owner ตรวจสอบการชำระเงิน (Manual)';
COMMENT ON COLUMN rentals.payment_verified_by_user_id IS 'ผู้ที่ตรวจสอบการชำระเงิน (FK to users.id)';
COMMENT ON COLUMN rentals.return_condition_status IS 'สภาพสินค้าเมื่อรับคืน';
COMMENT ON COLUMN rentals.notes_from_renter IS 'หมายเหตุจากผู้เช่าถึงผู้ให้เช่า (ตอนส่งคำขอ)';
COMMENT ON COLUMN rentals.notes_from_owner_on_return IS 'หมายเหตุจากผู้ให้เช่า (ตอนยืนยันการรับคืน)';
COMMENT ON COLUMN rentals.cancelled_at IS 'เวลาที่ยกเลิกการเช่า';
COMMENT ON COLUMN rentals.cancelled_by_user_id IS 'ผู้ที่ทำการยกเลิก (FK to users.id)';
COMMENT ON COLUMN rentals.cancellation_reason IS 'เหตุผลการยกเลิก';
COMMENT ON COLUMN rentals.created_at IS 'เวลาที่สร้างรายการเช่า';
COMMENT ON COLUMN rentals.updated_at IS 'เวลาที่แก้ไขรายการเช่าล่าสุด';

CREATE INDEX idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX idx_rentals_product_id ON rentals(product_id);
CREATE INDEX idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX idx_rentals_start_date ON rentals(start_date);
CREATE INDEX idx_rentals_end_date ON rentals(end_date);
CREATE INDEX idx_rentals_status ON rentals(rental_status);
CREATE INDEX idx_rentals_payment_status ON rentals(payment_status);

CREATE TRIGGER set_timestamp_rentals
BEFORE UPDATE ON rentals
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: rental_status_history
-- ---------------------------------
CREATE TABLE rental_status_history (
    id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    changed_by_user_id BIGINT NULL,
    changed_by_system BOOLEAN DEFAULT FALSE,
    notes TEXT NULL,
    CONSTRAINT fk_rental_status_history_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_rental_status_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE rental_status_history IS 'ตารางประวัติการเปลี่ยนแปลงสถานะการเช่า';
COMMENT ON COLUMN rental_status_history.id IS 'รหัสประวัติ (PK)';
COMMENT ON COLUMN rental_status_history.rental_id IS 'รหัสการเช่า (FK)';
COMMENT ON COLUMN rental_status_history.previous_status IS 'สถานะก่อนหน้า (ใช้ VARCHAR เพื่อความยืดหยุ่นถ้า ENUM ใน rentals เปลี่ยน)';
COMMENT ON COLUMN rental_status_history.new_status IS 'สถานะใหม่';
COMMENT ON COLUMN rental_status_history.changed_at IS 'เวลาที่เปลี่ยนสถานะ';
COMMENT ON COLUMN rental_status_history.changed_by_user_id IS 'ผู้ใช้ที่ทำให้เกิดการเปลี่ยนแปลง (FK to users.id, อาจเป็น renter, owner, admin)';
COMMENT ON COLUMN rental_status_history.changed_by_system IS 'เปลี่ยนโดยระบบหรือไม่ (เช่น หมดอายุคำขอ)';
COMMENT ON COLUMN rental_status_history.notes IS 'หมายเหตุการเปลี่ยนแปลง (เช่น เหตุผลการ reject, source of change)';

CREATE INDEX idx_rental_status_history_rental_id ON rental_status_history(rental_id);

-- ---------------------------------
-- Table: reviews
-- ---------------------------------
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL UNIQUE,
    renter_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    rating_product SMALLINT NOT NULL CHECK (rating_product BETWEEN 1 AND 5),
    rating_owner SMALLINT NOT NULL CHECK (rating_owner BETWEEN 1 AND 5),
    comment TEXT NULL,
    is_hidden_by_admin BOOLEAN DEFAULT FALSE,
    hidden_reason TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_renter FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE reviews IS 'ตารางรีวิวสินค้าและผู้ให้เช่า';
COMMENT ON COLUMN reviews.id IS 'รหัสรีวิว (PK)';
COMMENT ON COLUMN reviews.rental_id IS 'รหัสการเช่าที่รีวิว (FK, 1 รีวิวต่อ 1 การเช่าที่ completed)';
COMMENT ON COLUMN reviews.renter_id IS 'ผู้เช่าที่รีวิว (FK to users.id)';
COMMENT ON COLUMN reviews.product_id IS 'สินค้าที่ถูกรีวิว (FK)';
COMMENT ON COLUMN reviews.owner_id IS 'เจ้าของสินค้าที่ถูกรีวิว (FK to users.id)';
COMMENT ON COLUMN reviews.rating_product IS 'คะแนนสินค้า (1-5)';
COMMENT ON COLUMN reviews.rating_owner IS 'คะแนนผู้ให้เช่า (1-5)';
COMMENT ON COLUMN reviews.comment IS 'ความคิดเห็นรีวิว';
COMMENT ON COLUMN reviews.is_hidden_by_admin IS 'Admin ซ่อนรีวิวนี้หรือไม่ (ถ้าไม่เหมาะสม)';
COMMENT ON COLUMN reviews.hidden_reason IS 'เหตุผลที่ Admin ซ่อน';
COMMENT ON COLUMN reviews.created_at IS 'เวลาที่สร้างรีวิว';
COMMENT ON COLUMN reviews.updated_at IS 'เวลาที่แก้ไขรีวิวล่าสุด';

CREATE INDEX idx_reviews_renter_id ON reviews(renter_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_owner_id ON reviews(owner_id);

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for payout_methods table (ประเภทข้อมูล Enum สำหรับตาราง payout_methods)
-- ---------------------------------
CREATE TYPE payout_method_type_enum AS ENUM('bank_account', 'promptpay');

-- ---------------------------------
-- Table: payout_methods
-- ---------------------------------
CREATE TABLE payout_methods (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    method_type payout_method_type_enum NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payout_methods_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE payout_methods IS 'ตารางช่องทางการรับเงินของผู้ให้เช่า';
COMMENT ON COLUMN payout_methods.id IS 'รหัสช่องทางรับเงิน (PK)';
COMMENT ON COLUMN payout_methods.owner_id IS 'รหัสเจ้าของบัญชี (FK to users.id)';
COMMENT ON COLUMN payout_methods.method_type IS 'ประเภทช่องทางรับเงิน';
COMMENT ON COLUMN payout_methods.account_name IS 'ชื่อบัญชี (ตามหน้าสมุด หรือที่ลงทะเบียน PromptPay)';
COMMENT ON COLUMN payout_methods.account_number IS 'เลขที่บัญชี/เบอร์ PromptPay/เลข ปชช PromptPay';
COMMENT ON COLUMN payout_methods.bank_name IS 'ชื่อธนาคาร (ถ้าเป็น bank_account)';
COMMENT ON COLUMN payout_methods.is_primary IS 'เป็นช่องทางรับเงินหลักหรือไม่';
COMMENT ON COLUMN payout_methods.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN payout_methods.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE INDEX idx_payout_methods_owner_id ON payout_methods(owner_id);

CREATE TRIGGER set_timestamp_payout_methods
BEFORE UPDATE ON payout_methods
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: chat_conversations
-- ---------------------------------
CREATE TABLE chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    participant1_id BIGINT NOT NULL,
    participant2_id BIGINT NOT NULL,
    related_product_id BIGINT NULL,
    related_rental_id BIGINT NULL,
    last_message_id BIGINT NULL,
    last_message_at TIMESTAMPTZ NULL,
    p1_unread_count INT DEFAULT 0,
    p2_unread_count INT DEFAULT 0,
    p1_archived_at TIMESTAMPTZ NULL,
    p2_archived_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_conversations_p1 FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_conversations_p2 FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_conversations_product FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_chat_conversations_rental FOREIGN KEY (related_rental_id) REFERENCES rentals(id) ON DELETE SET NULL,
    CONSTRAINT uk_conversation_context UNIQUE (participant1_id, participant2_id, related_product_id, related_rental_id),
    CHECK (participant1_id <> participant2_id)
);
COMMENT ON TABLE chat_conversations IS 'ตารางห้องสนทนา (ระหว่างผู้ใช้ 2 คน)';
COMMENT ON COLUMN chat_conversations.id IS 'รหัสห้องสนทนา (PK)';
COMMENT ON COLUMN chat_conversations.conversation_uid IS 'รหัสอ้างอิงห้องแชท (UUID)';
COMMENT ON COLUMN chat_conversations.participant1_id IS 'ผู้ร่วมสนทนา 1 (FK to users.id)';
COMMENT ON COLUMN chat_conversations.participant2_id IS 'ผู้ร่วมสนทนา 2 (FK to users.id)';
COMMENT ON COLUMN chat_conversations.related_product_id IS 'สินค้าที่เกี่ยวข้อง (FK, optional, สำหรับเริ่มแชทจากหน้าสินค้า)';
COMMENT ON COLUMN chat_conversations.related_rental_id IS 'การเช่าที่เกี่ยวข้อง (FK, optional, สำหรับแชทใน context การเช่า)';
COMMENT ON COLUMN chat_conversations.last_message_id IS 'รหัสข้อความล่าสุด (FK อ้างอิงตาราง chat_messages เพื่อการดึงข้อมูลที่รวดเร็ว)';
COMMENT ON COLUMN chat_conversations.last_message_at IS 'เวลาของข้อความล่าสุด (denormalized for sorting inbox)';
COMMENT ON COLUMN chat_conversations.p1_unread_count IS 'จำนวนข้อความที่ participant1 ยังไม่อ่าน';
COMMENT ON COLUMN chat_conversations.p2_unread_count IS 'จำนวนข้อความที่ participant2 ยังไม่อ่าน';
COMMENT ON COLUMN chat_conversations.p1_archived_at IS 'เวลาที่ Participant 1 เก็บบทสนทนานี้';
COMMENT ON COLUMN chat_conversations.p2_archived_at IS 'เวลาที่ Participant 2 เก็บบทสนทนานี้';
COMMENT ON COLUMN chat_conversations.created_at IS 'เวลาที่สร้างห้องสนทนา';
COMMENT ON COLUMN chat_conversations.updated_at IS 'เวลาที่แก้ไขห้องสนทนาล่าสุด';
COMMENT ON CONSTRAINT uk_conversation_context ON chat_conversations IS 'ป้องกันห้องซ้ำซ้อนสำหรับ context เดียวกัน';


CREATE INDEX idx_chat_conversations_p1_p2 ON chat_conversations(participant1_id, participant2_id);
CREATE INDEX idx_chat_conversations_last_msg_at ON chat_conversations(last_message_at DESC);

CREATE TRIGGER set_timestamp_chat_conversations
BEFORE UPDATE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for chat_messages table (ประเภทข้อมูล Enum สำหรับตาราง chat_messages)
-- ---------------------------------
CREATE TYPE chat_message_type_enum AS ENUM('text', 'image', 'file', 'system_event', 'rental_offer');

-- ---------------------------------
-- Table: chat_messages
-- ---------------------------------
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    message_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_type chat_message_type_enum DEFAULT 'text',
    message_content TEXT NULL,
    attachment_url VARCHAR(255) NULL,
    attachment_metadata JSONB NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ NULL,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE chat_messages IS 'ตารางข้อความในห้องสนทนา';
COMMENT ON COLUMN chat_messages.id IS 'รหัสข้อความ (PK)';
COMMENT ON COLUMN chat_messages.message_uid IS 'รหัสอ้างอิงข้อความ (UUID)';
COMMENT ON COLUMN chat_messages.conversation_id IS 'รหัสห้องสนทนา (FK)';
COMMENT ON COLUMN chat_messages.sender_id IS 'ผู้ส่ง (FK to users.id)';
COMMENT ON COLUMN chat_messages.message_type IS 'ประเภทข้อความ';
COMMENT ON COLUMN chat_messages.message_content IS 'เนื้อหาข้อความ (ถ้าเป็น text หรือ system_event description)';
COMMENT ON COLUMN chat_messages.attachment_url IS 'URL ไฟล์แนบ (ถ้าเป็น image/file)';
COMMENT ON COLUMN chat_messages.attachment_metadata IS 'ข้อมูลเพิ่มเติมของไฟล์แนบ (ขนาด, ชื่อไฟล์, ประเภท)';
COMMENT ON COLUMN chat_messages.sent_at IS 'เวลาส่งข้อความ';
COMMENT ON COLUMN chat_messages.read_at IS 'เวลาที่ผู้รับ (อีกฝ่ายใน conversation) อ่านข้อความนี้';
COMMENT ON COLUMN chat_messages.is_deleted_by_sender IS 'ผู้ส่งลบข้อความนี้ (ฝั่งผู้ส่งจะไม่เห็น)';

CREATE INDEX idx_chat_messages_conversation_id_sent_at ON chat_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);

ALTER TABLE chat_conversations
ADD CONSTRAINT fk_chat_conversations_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- ---------------------------------
-- ENUM Types for claims table (ประเภทข้อมูล Enum สำหรับตาราง claims)
-- ---------------------------------
CREATE TYPE claim_type_enum AS ENUM('damage', 'loss', 'other');
CREATE TYPE claim_status_enum AS ENUM('open', 'awaiting_renter_response', 'awaiting_owner_counter_response', 'negotiating', 'pending_admin_review', 'resolved_by_agreement', 'resolved_by_admin', 'closed_withdrawn', 'closed_paid');

-- ---------------------------------
-- Table: claims
-- ---------------------------------
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    claim_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    rental_id BIGINT NOT NULL UNIQUE,
    reported_by_id BIGINT NOT NULL,
    accused_id BIGINT NOT NULL,
    claim_type claim_type_enum NOT NULL DEFAULT 'damage',
    claim_details TEXT NOT NULL,
    requested_amount DECIMAL(12, 2) NULL,
    status claim_status_enum DEFAULT 'open',
    renter_response_details TEXT NULL,
    owner_counter_response_details TEXT NULL,
    resolution_details TEXT NULL,
    resolved_amount DECIMAL(12, 2) NULL,
    admin_moderator_id BIGINT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_claims_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_reported_by FOREIGN KEY (reported_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claims_accused FOREIGN KEY (accused_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claims_admin_moderator FOREIGN KEY (admin_moderator_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE claims IS 'ตารางการเคลมสินค้าเสียหายจากการเช่า';
COMMENT ON COLUMN claims.id IS 'รหัสการเคลม (PK)';
COMMENT ON COLUMN claims.claim_uid IS 'รหัสอ้างอิงการเคลม (UUID)';
COMMENT ON COLUMN claims.rental_id IS 'รหัสการเช่าที่เกี่ยวข้อง (FK, 1 เคลมต่อ 1 การเช่า)';
COMMENT ON COLUMN claims.reported_by_id IS 'ผู้รายงานการเคลม (FK to users.id, มักเป็น Owner)';
COMMENT ON COLUMN claims.accused_id IS 'ผู้ถูกกล่าวหา (FK to users.id, มักเป็น Renter)';
COMMENT ON COLUMN claims.claim_type IS 'ประเภทการเคลม';
COMMENT ON COLUMN claims.claim_details IS 'รายละเอียดการเคลม';
COMMENT ON COLUMN claims.requested_amount IS 'จำนวนเงินที่เรียกร้อง (ถ้ามี)';
COMMENT ON COLUMN claims.status IS 'สถานะการเคลม';
COMMENT ON COLUMN claims.renter_response_details IS 'คำชี้แจงจากผู้เช่า';
COMMENT ON COLUMN claims.owner_counter_response_details IS 'การตอบกลับเพิ่มเติมจากผู้ให้เช่า';
COMMENT ON COLUMN claims.resolution_details IS 'รายละเอียดการแก้ไขปัญหา/ผลการตัดสินจาก Admin';
COMMENT ON COLUMN claims.resolved_amount IS 'จำนวนเงินที่ตกลง/ตัดสินให้ชดใช้';
COMMENT ON COLUMN claims.admin_moderator_id IS 'Admin ผู้ไกล่เกลี่ย/ตัดสิน (FK to users.id)';
COMMENT ON COLUMN claims.created_at IS 'เวลาที่สร้างการเคลม';
COMMENT ON COLUMN claims.updated_at IS 'เวลาที่แก้ไขการเคลมล่าสุด';
COMMENT ON COLUMN claims.closed_at IS 'เวลาที่ปิดการเคลม';

CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_rental_id ON claims(rental_id);

CREATE TRIGGER set_timestamp_claims
BEFORE UPDATE ON claims
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for claim_attachments table (ประเภทข้อมูล Enum สำหรับตาราง claim_attachments)
-- ---------------------------------
CREATE TYPE claim_uploader_role_enum AS ENUM('owner', 'renter', 'admin');

-- ---------------------------------
-- Table: claim_attachments
-- ---------------------------------
CREATE TABLE claim_attachments (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    uploaded_by_id BIGINT NOT NULL,
    uploader_role claim_uploader_role_enum NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_attachments_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_attachments_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT
);
COMMENT ON TABLE claim_attachments IS 'ตารางไฟล์แนบสำหรับการเคลม';
COMMENT ON COLUMN claim_attachments.id IS 'รหัสไฟล์แนบ (PK)';
COMMENT ON COLUMN claim_attachments.claim_id IS 'รหัสการเคลม (FK)';
COMMENT ON COLUMN claim_attachments.uploaded_by_id IS 'ผู้อัปโหลดไฟล์ (FK to users.id, owner or renter)';
COMMENT ON COLUMN claim_attachments.uploader_role IS 'บทบาทของผู้อัปโหลดในเคลมนี้';
COMMENT ON COLUMN claim_attachments.file_url IS 'URL ไฟล์แนบ';
COMMENT ON COLUMN claim_attachments.file_type IS 'ประเภทไฟล์ (เช่น image/jpeg, application/pdf)';
COMMENT ON COLUMN claim_attachments.description IS 'คำอธิบายไฟล์';
COMMENT ON COLUMN claim_attachments.uploaded_at IS 'เวลาที่อัปโหลด';

CREATE INDEX idx_claim_attachments_claim_id ON claim_attachments(claim_id);

-- ---------------------------------
-- ENUM Types for complaints table (ประเภทข้อมูล Enum สำหรับตาราง complaints)
-- ---------------------------------
CREATE TYPE complaint_status_enum AS ENUM('submitted', 'under_review', 'awaiting_user_response', 'investigating', 'resolved', 'closed_no_action', 'closed_escalated_to_claim');
CREATE TYPE complaint_priority_enum AS ENUM('low', 'medium', 'high', 'critical');

-- ---------------------------------
-- Table: complaints
-- ---------------------------------
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    complaint_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    complainant_id BIGINT NOT NULL,
    subject_user_id BIGINT NULL,
    related_rental_id BIGINT NULL,
    related_product_id BIGINT NULL,
    complaint_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    status complaint_status_enum DEFAULT 'submitted',
    admin_notes TEXT NULL,
    resolution_notes TEXT NULL,
    admin_handler_id BIGINT NULL,
    priority complaint_priority_enum DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ NULL,
    closed_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_complaints_complainant FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_complaints_subject_user FOREIGN KEY (subject_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaints_rental FOREIGN KEY (related_rental_id) REFERENCES rentals(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaints_product FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaints_admin_handler FOREIGN KEY (admin_handler_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE complaints IS 'ตารางการร้องเรียนปัญหาทั่วไปในระบบ';
COMMENT ON COLUMN complaints.id IS 'รหัสการร้องเรียน (PK)';
COMMENT ON COLUMN complaints.complaint_uid IS 'รหัสอ้างอิงการร้องเรียน (UUID)';
COMMENT ON COLUMN complaints.complainant_id IS 'ผู้ร้องเรียน (FK to users.id)';
COMMENT ON COLUMN complaints.subject_user_id IS 'ผู้ใช้ที่ถูกร้องเรียน (FK to users.id, optional)';
COMMENT ON COLUMN complaints.related_rental_id IS 'การเช่าที่เกี่ยวข้อง (FK, optional)';
COMMENT ON COLUMN complaints.related_product_id IS 'สินค้าที่เกี่ยวข้อง (FK, optional)';
COMMENT ON COLUMN complaints.complaint_type IS 'ประเภทการร้องเรียน (เช่น พฤติกรรมผู้ใช้, สินค้าไม่ตรงปก, ปัญหาการใช้งานระบบ)';
COMMENT ON COLUMN complaints.title IS 'หัวข้อเรื่องร้องเรียน';
COMMENT ON COLUMN complaints.details IS 'รายละเอียดการร้องเรียน';
COMMENT ON COLUMN complaints.status IS 'สถานะการร้องเรียน';
COMMENT ON COLUMN complaints.admin_notes IS 'บันทึกการดำเนินการของ Admin';
COMMENT ON COLUMN complaints.resolution_notes IS 'หมายเหตุการแก้ไขปัญหา/ผลการพิจารณา (ที่แสดงให้ผู้ร้องเรียนเห็น)';
COMMENT ON COLUMN complaints.admin_handler_id IS 'Admin ผู้รับผิดชอบ (FK to users.id)';
COMMENT ON COLUMN complaints.priority IS 'ระดับความสำคัญ';
COMMENT ON COLUMN complaints.created_at IS 'เวลาที่สร้างการร้องเรียน';
COMMENT ON COLUMN complaints.updated_at IS 'เวลาที่แก้ไขการร้องเรียนล่าสุด';
COMMENT ON COLUMN complaints.resolved_at IS 'เวลาที่แก้ไขปัญหาร้องเรียนเสร็จสิ้น';
COMMENT ON COLUMN complaints.closed_at IS 'เวลาที่ปิดเรื่องร้องเรียน';

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_complainant_id ON complaints(complainant_id);
CREATE INDEX idx_complaints_admin_handler_id ON complaints(admin_handler_id);

CREATE TRIGGER set_timestamp_complaints
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: complaint_attachments
-- ---------------------------------
CREATE TABLE complaint_attachments (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    uploaded_by_id BIGINT NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaint_attachments_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    CONSTRAINT fk_complaint_attachments_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT
);
COMMENT ON TABLE complaint_attachments IS 'ตารางไฟล์แนบสำหรับการร้องเรียน';
COMMENT ON COLUMN complaint_attachments.id IS 'รหัสไฟล์แนบ (PK)';
COMMENT ON COLUMN complaint_attachments.complaint_id IS 'รหัสการร้องเรียน (FK)';
COMMENT ON COLUMN complaint_attachments.uploaded_by_id IS 'ผู้อัปโหลดไฟล์ (FK to users.id)';
COMMENT ON COLUMN complaint_attachments.file_url IS 'URL ไฟล์แนบ';
COMMENT ON COLUMN complaint_attachments.file_type IS 'ประเภทไฟล์';
COMMENT ON COLUMN complaint_attachments.description IS 'คำอธิบายไฟล์';
COMMENT ON COLUMN complaint_attachments.uploaded_at IS 'เวลาที่อัปโหลด';

CREATE INDEX idx_complaint_attachments_complaint_id ON complaint_attachments(complaint_id);

-- ---------------------------------
-- Table: notifications
-- ---------------------------------
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255) NULL,
    related_entity_type VARCHAR(50) NULL,
    related_entity_id BIGINT NULL,
    related_entity_uid UUID NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE notifications IS 'ตารางการแจ้งเตือนต่างๆ ในระบบสำหรับผู้ใช้';
COMMENT ON COLUMN notifications.id IS 'รหัสการแจ้งเตือน (PK)';
COMMENT ON COLUMN notifications.user_id IS 'ผู้รับการแจ้งเตือน (FK to users.id)';
COMMENT ON COLUMN notifications.type IS 'ประเภทการแจ้งเตือน (เช่น new_message, rental_confirmed, id_verified)';
COMMENT ON COLUMN notifications.title IS 'หัวข้อการแจ้งเตือน (สรุปสั้นๆ)';
COMMENT ON COLUMN notifications.message IS 'เนื้อหาการแจ้งเตือน';
COMMENT ON COLUMN notifications.link_url IS 'URL สำหรับคลิกไปยังส่วนที่เกี่ยวข้อง (Frontend route)';
COMMENT ON COLUMN notifications.related_entity_type IS 'ประเภทของ Entity ที่เกี่ยวข้อง (เช่น rental, product, user, claim, complaint)';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID ของ Entity ที่เกี่ยวข้อง';
COMMENT ON COLUMN notifications.related_entity_uid IS 'UID ของ Entity ที่เกี่ยวข้อง (ถ้ามี)';
COMMENT ON COLUMN notifications.is_read IS 'อ่านแล้วหรือยัง';
COMMENT ON COLUMN notifications.read_at IS 'เวลาที่อ่าน';
COMMENT ON COLUMN notifications.created_at IS 'เวลาที่สร้างการแจ้งเตือน';

CREATE INDEX idx_notifications_user_id_read_created ON notifications(user_id, is_read, created_at DESC);

-- ---------------------------------
-- Table: wishlist
-- ---------------------------------
CREATE TABLE wishlist (
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
COMMENT ON TABLE wishlist IS 'ตารางรายการสินค้าโปรดของผู้ใช้';
COMMENT ON COLUMN wishlist.user_id IS 'รหัสผู้ใช้ (FK)';
COMMENT ON COLUMN wishlist.product_id IS 'รหัสสินค้า (FK)';
COMMENT ON COLUMN wishlist.added_at IS 'เวลาที่เพิ่มเข้า Wishlist';

-- ---------------------------------
-- Table: tags
-- ---------------------------------
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE tags IS 'ตารางเก็บแท็กสำหรับสินค้า (ถ้ามีระบบแท็ก)';
COMMENT ON COLUMN tags.id IS 'รหัสแท็ก (PK)';
COMMENT ON COLUMN tags.name IS 'ชื่อแท็ก (เช่น #กล้องฟิล์ม, #อุปกรณ์เดินป่า)';
COMMENT ON COLUMN tags.slug IS 'Slug ของแท็ก';
COMMENT ON COLUMN tags.created_at IS 'เวลาที่สร้างแท็ก';

-- ---------------------------------
-- Table: product_tags
-- ---------------------------------
CREATE TABLE product_tags (
    product_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_product_tags_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
COMMENT ON TABLE product_tags IS 'ตารางเชื่อมโยงสินค้ากับแท็ก (Many-to-Many)';
COMMENT ON COLUMN product_tags.product_id IS 'รหัสสินค้า (FK)';
COMMENT ON COLUMN product_tags.tag_id IS 'รหัสแท็ก (FK)';

-- ---------------------------------
-- ENUM Types for payment_transactions table (ประเภทข้อมูล Enum สำหรับตาราง payment_transactions)
-- ---------------------------------
CREATE TYPE payment_transaction_type_enum AS ENUM(
    'rental_payment',
    'deposit_refund',
    'rental_fee_payout',
    'platform_fee',
    'late_fee_payment',
    'claim_settlement_to_owner',
    'claim_settlement_from_renter',
    'other_credit',
    'other_debit'
);
CREATE TYPE payment_transaction_status_enum AS ENUM('pending', 'successful', 'failed', 'cancelled', 'disputed', 'requires_action', 'refunded_full', 'refunded_partial');

-- ---------------------------------
-- Table: payment_transactions
-- ---------------------------------
CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_uid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    rental_id BIGINT NULL,
    user_id BIGINT NOT NULL,
    transaction_type payment_transaction_type_enum NOT NULL,
    payment_method_name VARCHAR(100) NULL,
    payment_gateway_name VARCHAR(50) NULL,
    gateway_transaction_id VARCHAR(255) NULL,
    gateway_charge_id VARCHAR(255) NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status payment_transaction_status_enum NOT NULL,
    payment_method_details JSONB NULL,
    error_code_gateway VARCHAR(100) NULL,
    error_message_gateway TEXT NULL,
    transaction_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    CONSTRAINT fk_payment_transactions_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
COMMENT ON TABLE payment_transactions IS 'ตารางบันทึกธุรกรรมการชำระเงินและ Payout';
COMMENT ON COLUMN payment_transactions.id IS 'รหัสธุรกรรม (PK)';
COMMENT ON COLUMN payment_transactions.transaction_uid IS 'รหัสอ้างอิงธุรกรรม (UUID)';
COMMENT ON COLUMN payment_transactions.rental_id IS 'การเช่าที่เกี่ยวข้อง (FK, optional, อาจมีธุรกรรมอื่นที่ไม่ผูกกับการเช่าโดยตรง)';
COMMENT ON COLUMN payment_transactions.user_id IS 'ผู้ใช้ที่เกี่ยวข้องกับธุรกรรม (เช่น ผู้จ่าย, ผู้รับ payout) (FK)';
COMMENT ON COLUMN payment_transactions.transaction_type IS 'ประเภทธุรกรรม';
COMMENT ON COLUMN payment_transactions.payment_method_name IS 'ชื่อช่องทางการชำระเงิน (เช่น credit_card, bank_transfer, promptpay_qr)';
COMMENT ON COLUMN payment_transactions.payment_gateway_name IS 'ชื่อ Payment Gateway (เช่น Omise, Stripe)';
COMMENT ON COLUMN payment_transactions.gateway_transaction_id IS 'รหัสธุรกรรมจาก Gateway (ถ้ามี)';
COMMENT ON COLUMN payment_transactions.gateway_charge_id IS 'รหัส Charge จาก Gateway (ถ้ามี)';
COMMENT ON COLUMN payment_transactions.amount IS 'จำนวนเงิน (ถ้าเป็น debit ให้ใส่ > 0 และดู transaction_type)';
COMMENT ON COLUMN payment_transactions.currency IS 'สกุลเงิน';
COMMENT ON COLUMN payment_transactions.status IS 'สถานะธุรกรรม';
COMMENT ON COLUMN payment_transactions.payment_method_details IS 'รายละเอียดช่องทาง (เช่น เลขท้าย 4 ตัวบัตร, ชื่อธนาคาร, reference code โอน)';
COMMENT ON COLUMN payment_transactions.error_code_gateway IS 'รหัสข้อผิดพลาดจาก Gateway';
COMMENT ON COLUMN payment_transactions.error_message_gateway IS 'ข้อความข้อผิดพลาดจาก Gateway';
COMMENT ON COLUMN payment_transactions.transaction_time IS 'เวลาทำธุรกรรม (อาจเป็นเวลาที่ Gateway confirm)';
COMMENT ON COLUMN payment_transactions.notes IS 'หมายเหตุเพิ่มเติมเกี่ยวกับธุรกรรมนี้';

CREATE INDEX idx_payment_transactions_rental_id ON payment_transactions(rental_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_gateway_txn_id ON payment_transactions(gateway_transaction_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- ---------------------------------
-- Table: admin_logs
-- ---------------------------------
CREATE TABLE admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_entity_type VARCHAR(50) NULL,
    target_entity_id BIGINT NULL,
    target_entity_uid UUID NULL,
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
COMMENT ON TABLE admin_logs IS 'ตารางบันทึกการกระทำของผู้ดูแลระบบ';
COMMENT ON COLUMN admin_logs.id IS 'รหัส Log (PK)';
COMMENT ON COLUMN admin_logs.admin_user_id IS 'Admin ที่กระทำการ (FK to users.id)';
COMMENT ON COLUMN admin_logs.action_type IS 'ประเภทการกระทำ (เช่น USER_UPDATE, PRODUCT_APPROVE, SETTING_CHANGE)';
COMMENT ON COLUMN admin_logs.target_entity_type IS 'ประเภทของ Entity ที่ถูกกระทำ (เช่น User, Product, Rental)';
COMMENT ON COLUMN admin_logs.target_entity_id IS 'ID ของ Record ที่ถูกกระทำ';
COMMENT ON COLUMN admin_logs.target_entity_uid IS 'UID ของ Record ที่ถูกกระทำ (ถ้ามี)';
COMMENT ON COLUMN admin_logs.details IS 'รายละเอียดเพิ่มเติม (เช่น ข้อมูลเก่า vs ข้อมูลใหม่, เหตุผล)';
COMMENT ON COLUMN admin_logs.ip_address IS 'IP Address ของ Admin';
COMMENT ON COLUMN admin_logs.user_agent IS 'User Agent ของ Admin';
COMMENT ON COLUMN admin_logs.created_at IS 'เวลาที่บันทึก Log';

-- ---------------------------------
-- Table: faq_categories
-- ---------------------------------
CREATE TABLE faq_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100) UNIQUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE faq_categories IS 'ตารางหมวดหมู่ของคำถามที่พบบ่อย (FAQ)';
COMMENT ON COLUMN faq_categories.id IS 'รหัสหมวดหมู่ FAQ (PK)';
COMMENT ON COLUMN faq_categories.name IS 'ชื่อหมวดหมู่ FAQ (ภาษาหลัก)';
COMMENT ON COLUMN faq_categories.name_en IS 'ชื่อหมวดหมู่ FAQ (ภาษาอังกฤษ)';
COMMENT ON COLUMN faq_categories.sort_order IS 'ลำดับการแสดงผล';
COMMENT ON COLUMN faq_categories.is_active IS 'สถานะการใช้งาน';
COMMENT ON COLUMN faq_categories.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN faq_categories.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE TRIGGER set_timestamp_faq_categories
BEFORE UPDATE ON faq_categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: faqs
-- ---------------------------------
CREATE TABLE faqs (
    id BIGSERIAL PRIMARY KEY,
    faq_category_id BIGINT NULL,
    question TEXT NOT NULL,
    question_en TEXT NULL,
    answer TEXT NOT NULL,
    answer_en TEXT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by_admin_id BIGINT NULL,
    CONSTRAINT fk_faqs_category FOREIGN KEY (faq_category_id) REFERENCES faq_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_faqs_updated_by_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE faqs IS 'ตารางคำถามที่พบบ่อย (FAQ)';
COMMENT ON COLUMN faqs.id IS 'รหัส FAQ (PK)';
COMMENT ON COLUMN faqs.faq_category_id IS 'รหัสหมวดหมู่ FAQ (FK)';
COMMENT ON COLUMN faqs.question IS 'คำถาม (ภาษาหลัก)';
COMMENT ON COLUMN faqs.question_en IS 'คำถาม (ภาษาอังกฤษ)';
COMMENT ON COLUMN faqs.answer IS 'คำตอบ (HTML, ภาษาหลัก)';
COMMENT ON COLUMN faqs.answer_en IS 'คำตอบ (HTML, ภาษาอังกฤษ)';
COMMENT ON COLUMN faqs.sort_order IS 'ลำดับการแสดงผล';
COMMENT ON COLUMN faqs.is_active IS 'สถานะการใช้งาน';
COMMENT ON COLUMN faqs.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN faqs.updated_at IS 'เวลาที่แก้ไขล่าสุด';
COMMENT ON COLUMN faqs.updated_by_admin_id IS 'Admin ที่แก้ไขล่าสุด (FK to users.id)';

CREATE TRIGGER set_timestamp_faqs
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for system_settings table (ประเภทข้อมูล Enum สำหรับตาราง system_settings)
-- ---------------------------------
CREATE TYPE system_settings_data_type_enum AS ENUM('string', 'integer', 'float', 'boolean', 'json', 'text');

-- ---------------------------------
-- Table: system_settings
-- ---------------------------------
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    data_type system_settings_data_type_enum DEFAULT 'string',
    is_publicly_readable BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    validation_rules VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by_admin_id BIGINT NULL,
    CONSTRAINT fk_system_settings_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE system_settings IS 'ตารางการตั้งค่าต่างๆ ของระบบ';
COMMENT ON COLUMN system_settings.setting_key IS 'Key ของการตั้งค่า (เช่น site_name, default_commission_rate)';
COMMENT ON COLUMN system_settings.setting_value IS 'Value ของการตั้งค่า';
COMMENT ON COLUMN system_settings.description IS 'คำอธิบายการตั้งค่า';
COMMENT ON COLUMN system_settings.data_type IS 'ประเภทข้อมูลของ value';
COMMENT ON COLUMN system_settings.is_publicly_readable IS 'สามารถอ่านค่านี้ได้จาก API ทั่วไปหรือไม่ (สำหรับ Frontend settings)';
COMMENT ON COLUMN system_settings.is_encrypted IS 'เข้ารหัส value หรือไม่ (สำหรับข้อมูล sensitive เช่น API keys)';
COMMENT ON COLUMN system_settings.validation_rules IS 'กฎสำหรับ validate ค่า (เช่น min:0, max:100)';
COMMENT ON COLUMN system_settings.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN system_settings.updated_at IS 'เวลาที่แก้ไขล่าสุด';
COMMENT ON COLUMN system_settings.updated_by_admin_id IS 'Admin ที่แก้ไขล่าสุด (FK to users.id)';

CREATE TRIGGER set_timestamp_system_settings
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- Table: static_pages
-- ---------------------------------
CREATE TABLE static_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NULL,
    content_html TEXT NOT NULL,
    content_html_en TEXT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by_admin_id BIGINT NULL,
    CONSTRAINT fk_static_pages_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE static_pages IS 'ตารางเนื้อหาสำหรับหน้า Static (เช่น Terms, Privacy, About Us)';
COMMENT ON COLUMN static_pages.id IS 'รหัสหน้า (PK)';
COMMENT ON COLUMN static_pages.slug IS 'Slug สำหรับ URL (เช่น terms-and-conditions, privacy-policy)';
COMMENT ON COLUMN static_pages.title IS 'หัวข้อหน้า (ภาษาหลัก)';
COMMENT ON COLUMN static_pages.title_en IS 'หัวข้อหน้า (ภาษาอังกฤษ)';
COMMENT ON COLUMN static_pages.content_html IS 'เนื้อหาหน้า (HTML, ภาษาหลัก)';
COMMENT ON COLUMN static_pages.content_html_en IS 'เนื้อหาหน้า (HTML, ภาษาอังกฤษ)';
COMMENT ON COLUMN static_pages.meta_title IS 'Meta Title (สำหรับ SEO)';
COMMENT ON COLUMN static_pages.meta_description IS 'Meta Description (สำหรับ SEO)';
COMMENT ON COLUMN static_pages.is_published IS 'เผยแพร่หน้านี้หรือไม่';
COMMENT ON COLUMN static_pages.created_at IS 'เวลาที่สร้าง';
COMMENT ON COLUMN static_pages.updated_at IS 'เวลาที่แก้ไขล่าสุด';
COMMENT ON COLUMN static_pages.updated_by_admin_id IS 'Admin ที่แก้ไขล่าสุด (FK to users.id)';

CREATE TRIGGER set_timestamp_static_pages
BEFORE UPDATE ON static_pages
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------
-- ENUM Types for contact_form_submissions table (ประเภทข้อมูล Enum สำหรับตาราง contact_form_submissions)
-- ---------------------------------
CREATE TYPE contact_form_status_enum AS ENUM('new', 'read', 'replied', 'closed');

-- ---------------------------------
-- Table: contact_form_submissions
-- ---------------------------------
CREATE TABLE contact_form_submissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status contact_form_status_enum DEFAULT 'new',
    replied_by_admin_id BIGINT NULL,
    replied_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_submissions_admin FOREIGN KEY (replied_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE contact_form_submissions IS 'ตารางเก็บข้อความจากหน้าติดต่อเรา (ถ้าต้องการเก็บใน DB)';
COMMENT ON COLUMN contact_form_submissions.id IS 'รหัสข้อความติดต่อ (PK)';
COMMENT ON COLUMN contact_form_submissions.name IS 'ชื่อผู้ติดต่อ';
COMMENT ON COLUMN contact_form_submissions.email IS 'อีเมลผู้ติดต่อ';
COMMENT ON COLUMN contact_form_submissions.phone IS 'เบอร์โทรผู้ติดต่อ';
COMMENT ON COLUMN contact_form_submissions.subject IS 'หัวข้อเรื่อง';
COMMENT ON COLUMN contact_form_submissions.message IS 'ข้อความ';
COMMENT ON COLUMN contact_form_submissions.ip_address IS 'IP Address ผู้ส่ง';
COMMENT ON COLUMN contact_form_submissions.user_agent IS 'User Agent ผู้ส่ง';
COMMENT ON COLUMN contact_form_submissions.status IS 'สถานะการจัดการข้อความ';
COMMENT ON COLUMN contact_form_submissions.replied_by_admin_id IS 'Admin ที่ตอบกลับ (FK to users.id)';
COMMENT ON COLUMN contact_form_submissions.replied_at IS 'เวลาที่ตอบกลับ';
COMMENT ON COLUMN contact_form_submissions.created_at IS 'เวลาที่ส่งข้อความ';
COMMENT ON COLUMN contact_form_submissions.updated_at IS 'เวลาที่แก้ไขล่าสุด';

CREATE TRIGGER set_timestamp_contact_form_submissions
BEFORE UPDATE ON contact_form_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
