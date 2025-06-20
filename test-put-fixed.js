import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const testPutFixed = async () => {
    try {
        console.log('Testing PUT request with fixed form data structure...');

        // Test data for updating product
        const productData = {
            title: "กล้อง DSLR Canon EOS R5 (อัปเดต)",
            description: "กล้อง DSLR ระดับมืออาชีพ พร้อมเลนส์ 24-70mm f/2.8 - อัปเดตราคาใหม่",
            rental_price_per_day: "1800.00",
            rental_price_per_week: "10000.00",
            rental_price_per_month: "40000.00",
            security_deposit: "6000.00",
            quantity: "3",
            condition_notes: "กล้องสภาพดี ใช้งานได้ปกติ มีการบำรุงรักษาใหม่",
            specifications: JSON.stringify({
                brand: "Canon",
                model: "EOS R5",
                sensor: "45MP",
                lens: "24-70mm f/2.8",
                condition: "Excellent",
                updated: "2024-01-15"
            }),
            remove_image_ids: "1,3" // Text field, not file
        };

        // Create form data
        const form = new FormData();
        
        // Add text fields
        Object.keys(productData).forEach(key => {
            form.append(key, productData[key]);
            console.log(`Added field: ${key} = ${productData[key]}`);
        });

        // Add test image files (if they exist)
        const testImagePath = path.join(process.cwd(), 'test-image.jpg');
        if (fs.existsSync(testImagePath)) {
            form.append('new_images[]', fs.createReadStream(testImagePath));
            console.log('Added test image to form');
        } else {
            console.log('No test image found, updating product without new images');
        }

        // You'll need to get a valid JWT token first
        const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
        const productId = '1'; // Replace with actual product ID or slug

        console.log('Sending request...');
        console.log('URL:', `http://localhost:3001/api/products/${productId}`);
        console.log('Headers:', {
            'Authorization': `Bearer ${token}`,
            'Content-Type': form.getHeaders()['content-type']
        });

        const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
            method: 'PUT',
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
            console.log('✅ Product updated successfully!');
        } else {
            console.log('❌ Failed to update product');
        }

    } catch (error) {
        console.error('Error testing PUT upload:', error);
    }
};

// Run the test
testPutFixed(); 