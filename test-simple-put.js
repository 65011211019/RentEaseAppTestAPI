import FormData from 'form-data';
import fetch from 'node-fetch';

const testSimplePut = async () => {
    try {
        console.log('Testing simple PUT request without files...');

        // Simple test data (text only, no files)
        const productData = {
            title: "กล้อง DSLR Canon EOS R5 (อัปเดต)",
            description: "กล้อง DSLR ระดับมืออาชีพ พร้อมเลนส์ 24-70mm f/2.8 - อัปเดตราคาใหม่",
            rental_price_per_day: "1800.00",
            quantity: "3"
        };

        // Create form data
        const form = new FormData();
        
        // Add text fields only
        Object.keys(productData).forEach(key => {
            form.append(key, productData[key]);
            console.log(`Added field: ${key} = ${productData[key]}`);
        });

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
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response body:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('✅ Product updated successfully!');
        } else {
            console.log('❌ Failed to update product');
        }

    } catch (error) {
        console.error('Error testing simple PUT:', error);
    }
};

// Run the test
testSimplePut(); 