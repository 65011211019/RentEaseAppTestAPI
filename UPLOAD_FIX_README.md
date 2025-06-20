# แก้ไขปัญหา Upload รูปภาพ

## ปัญหาที่พบ
1. การใช้ multer แบบเก่าใน product.routes.js
2. การเข้าถึง req.files ไม่ถูกต้องใน controller
3. ขาดการตรวจสอบและสร้าง storage bucket ใน Supabase

## การแก้ไขที่ทำ

### 1. แก้ไข product.routes.js
- เปลี่ยนจาก `upload.array()` เป็น `uploadMultipleFields()`
- ใช้ middleware ที่มีอยู่แล้วแทนการสร้าง multer ใหม่
- เพิ่ม logging สำหรับ debug

### 2. แก้ไข product.controller.js
- แก้ไขการเข้าถึง files จาก `req.files['images[]']`
- เพิ่มการตรวจสอบ file validation
- แก้ไข updateProduct controller

### 3. แก้ไข product.service.js
- เพิ่ม logging สำหรับ debug
- เพิ่มการตรวจสอบ file validation
- ปรับปรุง error handling

### 4. แก้ไข fileUpload.js middleware
- แก้ไข fileFilter error handling
- เพิ่ม logging สำหรับ debug
- ปรับปรุง validation logic

### 5. สร้าง setupStorage.js
- สร้าง utility สำหรับตรวจสอบและสร้าง storage buckets
- เพิ่มการ setup ใน server.js

## วิธีทดสอบ

### 1. เริ่มต้น Server
```bash
npm start
```

### 2. ตรวจสอบ Storage Buckets
Server จะสร้าง buckets อัตโนมัติเมื่อเริ่มต้น:
- `product-images`
- `avatars`
- `id-verification`

### 3. ทดสอบด้วย Postman

**URL:** `POST http://localhost:3001/api/products`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (Form-data):**
```
title: "กล้อง DSLR Canon EOS R5"
category_id: 1
province_id: 1
description: "กล้อง DSLR ระดับมืออาชีพ"
rental_price_per_day: 1500.00
images[]: [ไฟล์รูปภาพ]
```

### 4. ทดสอบด้วย Script
```bash
# แก้ไข token ใน test-upload.js
node test-upload.js
```

## การ Debug

### 1. ตรวจสอบ Logs
Server จะแสดง logs:
- File upload processing
- Storage bucket creation
- File validation

### 2. ตรวจสอบ Supabase Storage
- ไปที่ Supabase Dashboard
- ตรวจสอบ Storage > Buckets
- ตรวจสอบไฟล์ที่ upload

### 3. ตรวจสอบ Database
- ตรวจสอบตาราง `products`
- ตรวจสอบตาราง `product_images`

## ปัญหาที่อาจเกิดขึ้น

### 1. "Bucket not found"
- ตรวจสอบว่า bucket `product-images` ถูกสร้างแล้ว
- ตรวจสอบ Supabase permissions

### 2. "File too large"
- ตรวจสอบ file size (max 5MB)
- ตรวจสอบ multer limits

### 3. "Invalid file type"
- ตรวจสอบ file type (ต้องเป็น image)
- ตรวจสอบ fileFilter middleware

### 4. "Authentication required"
- ตรวจสอบ JWT token
- ตรวจสอบ Authorization header

## การตั้งค่า Environment Variables

ตรวจสอบไฟล์ `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
```

## การตั้งค่า Supabase Storage

1. ไปที่ Supabase Dashboard
2. ไปที่ Storage
3. สร้าง bucket `product-images` (ถ้ายังไม่มี)
4. ตั้งค่า bucket เป็น public
5. ตั้งค่า RLS policies ตามต้องการ 