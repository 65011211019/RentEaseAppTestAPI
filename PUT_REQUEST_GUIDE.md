# PUT Request Guide - Products API

## 📍 **URL:** `PUT http://localhost:3001/api/products/{product_slug_or_id}`

## 🔐 **Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

## 📦 **Body (Form-data):**

### **File Fields (สำหรับรูปภาพ):**
- `new_images[]` (file array, max 10 files) - รูปภาพใหม่ที่ต้องการเพิ่ม

### **Text Fields (สำหรับข้อมูลสินค้า):**
- `title` (string, max 255 chars) - ชื่อสินค้า
- `category_id` (number) - รหัสหมวดหมู่สินค้า
- `province_id` (number) - รหัสจังหวัดที่ตั้งสินค้า
- `description` (text) - รายละเอียดสินค้า
- `rental_price_per_day` (number, 2 decimal places) - ราคาเช่าต่อวัน
- `rental_price_per_week` (number, 2 decimal places) - ราคาเช่าต่อสัปดาห์
- `rental_price_per_month` (number, 2 decimal places) - ราคาเช่าต่อเดือน
- `security_deposit` (number, 2 decimal places) - ค่ามัดจำ
- `quantity` (integer, min: 0) - จำนวนสินค้าทั้งหมด
- `min_rental_duration_days` (integer, min: 1) - ระยะเวลาเช่าขั้นต่ำ (วัน)
- `max_rental_duration_days` (integer, min: min_rental_duration_days) - ระยะเวลาเช่าสูงสุด (วัน)
- `address_details` (string, max 255 chars) - รายละเอียดที่ตั้งสินค้าเพิ่มเติม
- `latitude` (number, precision 8, range: -90 to 90) - ละติจูด
- `longitude` (number, precision 8, range: -180 to 180) - ลองจิจูด
- `condition_notes` (text) - หมายเหตุสภาพสินค้า
- `specifications` (JSON object) - คุณสมบัติ/สเปคสินค้า
- `remove_image_ids` (string) - รหัสรูปภาพที่ต้องการลบ (คั่นด้วย comma เช่น "1,2,3")

## 📋 **ตัวอย่าง Postman Request:**

### **URL:**
```
PUT http://localhost:3001/api/products/1
```

### **Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

### **Body (Form-data):**
```
Key: title
Value: "กล้อง DSLR Canon EOS R5 (อัปเดต)"
Type: Text

Key: description
Value: "กล้อง DSLR ระดับมืออาชีพ พร้อมเลนส์ 24-70mm f/2.8"
Type: Text

Key: rental_price_per_day
Value: 1800.00
Type: Text

Key: rental_price_per_week
Value: 10000.00
Type: Text

Key: rental_price_per_month
Value: 40000.00
Type: Text

Key: security_deposit
Value: 6000.00
Type: Text

Key: quantity
Value: 3
Type: Text

Key: condition_notes
Value: "กล้องสภาพดี ใช้งานได้ปกติ"
Type: Text

Key: specifications
Value: {"brand": "Canon", "model": "EOS R5", "sensor": "45MP"}
Type: Text

Key: remove_image_ids
Value: "1,3"
Type: Text

Key: new_images[]
Value: [เลือกไฟล์รูปภาพ]
Type: File
```

## ⚠️ **สิ่งสำคัญที่ต้องระวัง:**

### 1. **Field Names ที่ถูกต้อง:**
- ✅ `new_images[]` - สำหรับรูปภาพใหม่ (ไฟล์)
- ✅ `remove_image_ids` - สำหรับลบรูปภาพ (ข้อความ) - **ไม่มี []**
- ❌ `remove_image_ids[]` - ไม่ถูกต้อง (ไม่มี [])

### 2. **Data Types:**
- **File Fields:** ใช้ `new_images[]` เท่านั้น
- **Text Fields:** ใช้ field names ปกติ (ไม่มี [])
- **Numbers:** ส่งเป็น string หรือ number ได้
- **JSON:** ส่งเป็น string

### 3. **การส่งข้อมูล:**
- สามารถส่งเฉพาะฟิลด์ที่ต้องการแก้ไขได้
- ไม่จำเป็นต้องส่งทุกฟิลด์
- ไฟล์และข้อความสามารถส่งพร้อมกันได้

## 🧪 **การทดสอบ:**

### 1. ทดสอบด้วย Script:
```bash
node test-put-fixed.js
```

### 2. ทดสอบแบบง่าย (ไม่มีไฟล์):
```bash
node test-simple-put.js
```

## 🔄 **Response Example:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "title": "กล้อง DSLR Canon EOS R5 (อัปเดต)",
    "slug": "กล้อง-dslr-canon-eos-r5-อัปเดต",
    "description": "กล้อง DSLR ระดับมืออาชีพ...",
    "rental_price_per_day": 1800.00,
    "images": [
      {
        "id": 2,
        "image_url": "https://...",
        "is_primary": true
      }
    ]
  }
}
```

## 🚨 **Error Messages และวิธีแก้ไข:**

### "Missing required files: remove_image_ids[]"
- **สาเหตุ:** ใช้ `remove_image_ids[]` แทน `remove_image_ids`
- **วิธีแก้:** ใช้ `remove_image_ids` (ไม่มี [])

### "Content-Type must be multipart/form-data"
- **สาเหตุ:** Content-Type ไม่ถูกต้อง
- **วิธีแก้:** ตั้งค่า Content-Type เป็น `multipart/form-data`

### "File is too large"
- **สาเหตุ:** ไฟล์ใหญ่เกิน 5MB
- **วิธีแก้:** ใช้ไฟล์ที่เล็กลง

### "Only image files are allowed"
- **สาเหตุ:** ไฟล์ไม่ใช่รูปภาพ
- **วิธีแก้:** ใช้ไฟล์รูปภาพเท่านั้น (JPEG, PNG, etc.) 