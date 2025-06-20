import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const testUpload = async () => {
    try {
        // Test data
        const productData = {
            title: "กล้อง DSLR Canon EOS R5",
            category_id: 1,
            province_id: 1,
            description: "กล้อง DSLR ระดับมืออาชีพ พร้อมเลนส์ 24-70mm f/2.8",
            rental_price_per_day: 1500.00,
            rental_price_per_week: 9000.00,
            rental_price_per_month: 35000.00,
            security_deposit: 5000.00,
            quantity: 2,
            min_rental_duration_days: 1,
            max_rental_duration_days: 30,
            address_details: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย",
            latitude: 13.7563,
            longitude: 100.5018,
            condition_notes: "กล้องสภาพดี ใช้งานได้ปกติ",
            specifications: JSON.stringify({
                brand: "Canon",
                model: "EOS R5",
                sensor: "45MP",
                lens: "24-70mm f/2.8",
                condition: "Excellent"
            })
        };

        // Create form data
        const form = new FormData();
        
        // Add text fields
        Object.keys(productData).forEach(key => {
            form.append(key, productData[key]);
        });

        // Add test image files (if they exist)
        const testImagePath = path.join(process.cwd(), 'test-image.jpg');
        if (fs.existsSync(testImagePath)) {
            form.append('images[]', fs.createReadStream(testImagePath));
            console.log('Added test image to form');
        } else {
            console.log('No test image found, creating product without images');
        }

        // You'll need to get a valid JWT token first
        const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

        const response = await fetch('http://localhost:3001/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const result = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('✅ Product created successfully!');
        } else {
            console.log('❌ Failed to create product');
        }

    } catch (error) {
        console.error('Error testing upload:', error);
    }
};

// Run the test
testUpload(); 