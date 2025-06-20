# แก้ไขปัญหา Form Data - Debug Guide

## 🔍 การวิเคราะห์ปัญหา

ข้อผิดพลาด "Invalid form data format" เกิดจากปัญหาการส่งข้อมูล multipart/form-data ไม่ถูกต้อง

## 🛠️ วิธีแก้ไขทีละขั้นตอน

### 1. ทดสอบแบบง่าย (ไม่มีไฟล์)

#### Postman Setup:
```
Method: PUT
URL: http://localhost:3001/api/products/1
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: multipart/form-data

Body (form-data):
  Key: title
  Value: "ชื่อสินค้าใหม่"
  Type: Text
```

#### หรือใช้ Script:
```bash
node test-simple-put.js
```

### 2. ตรวจสอบ Content-Type

#### ที่ถูกต้อง:
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryABC123
```

#### ที่ผิด:
```
Content-Type: application/json
Content-Type: application/x-www-form-urlencoded
```

### 3. ตรวจสอบ Field Names

#### สำหรับ PUT /api/products/{id}:
- ✅ `title` (text)
- ✅ `description` (text)
- ✅ `rental_price_per_day` (text)
- ✅ `new_images[]` (file) - สำหรับรูปภาพใหม่
- ✅ `remove_image_ids[]` (text) - สำหรับลบรูปภาพ

#### ที่ผิด:
- ❌ `images[]` (ใช้สำหรับ POST เท่านั้น)
- ❌ `remove_image_ids` (ไม่มี [])

### 4. ตรวจสอบ Data Types

#### Text Fields:
```
Key: title
Value: "ชื่อสินค้า"
Type: Text
```

#### Number Fields:
```
Key: rental_price_per_day
Value: "1800.00"  // หรือ 1800.00
Type: Text
```

#### File Fields:
```
Key: new_images[]
Value: [เลือกไฟล์]
Type: File
```

## 🧪 การทดสอบ

### Test 1: Text Only
```javascript
const form = new FormData();
form.append('title', 'ชื่อสินค้าใหม่');
form.append('description', 'รายละเอียดใหม่');
```

### Test 2: With Files
```javascript
const form = new FormData();
form.append('title', 'ชื่อสินค้าใหม่');
form.append('new_images[]', fileInput.files[0]);
form.append('remove_image_ids[]', '1,2');
```

### Test 3: Complete Example
```javascript
const form = new FormData();
form.append('title', 'กล้อง DSLR Canon EOS R5 (อัปเดต)');
form.append('description', 'กล้อง DSLR ระดับมืออาชีพ');
form.append('rental_price_per_day', '1800.00');
form.append('quantity', '3');
form.append('new_images[]', file1);
form.append('new_images[]', file2);
form.append('remove_image_ids[]', '1,3');
```

## 🔧 การ Debug

### 1. ตรวจสอบ Logs
Server จะแสดง:
```
Upload middleware processing fields: [...]
Request Content-Type: multipart/form-data; boundary=...
Files received: {...}
Body received: {...}
```

### 2. ตรวจสอบ Request Headers
```javascript
console.log('Content-Type:', req.headers['content-type']);
console.log('Content-Length:', req.headers['content-length']);
```

### 3. ตรวจสอบ Form Data
```javascript
console.log('Form fields:', Object.keys(req.body));
console.log('Files:', Object.keys(req.files || {}));
```

## ⚠️ สิ่งที่ต้องระวัง

### 1. Boundary Issues
- อย่าตั้งค่า boundary เอง
- ให้ Postman หรือ FormData จัดการเอง

### 2. Field Order
- ไฟล์ควรอยู่ท้ายสุด
- ข้อความควรอยู่ก่อน

### 3. File Validation
- ไฟล์ต้องเป็นรูปภาพ
- ขนาดไม่เกิน 5MB
- ใช้ field name ที่ถูกต้อง

## 📝 ตัวอย่าง Postman ที่ถูกต้อง

### Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

### Body (form-data):
```
Key: title
Value: กล้อง DSLR Canon EOS R5 (อัปเดต)
Type: Text

Key: description
Value: กล้อง DSLR ระดับมืออาชีพ พร้อมเลนส์ 24-70mm f/2.8
Type: Text

Key: rental_price_per_day
Value: 1800.00
Type: Text

Key: new_images[]
Value: [เลือกไฟล์รูปภาพ]
Type: File

Key: remove_image_ids[]
Value: 1,3
Type: Text
```

## 🚨 Error Messages และวิธีแก้ไข

### "Content-Type header is missing"
- เพิ่ม `Content-Type: multipart/form-data` ใน headers

### "Content-Type must be multipart/form-data"
- ตรวจสอบ Content-Type header
- อย่าใช้ `application/json`

### "Invalid multipart form data"
- ตรวจสอบ field names
- ตรวจสอบ data types
- ตรวจสอบ file upload

### "File is too large"
- ลดขนาดไฟล์ (max 5MB)
- ใช้ไฟล์ที่เล็กลง

### "Only image files are allowed"
- ใช้ไฟล์รูปภาพเท่านั้น (JPEG, PNG, etc.)
- ตรวจสอบ file extension 