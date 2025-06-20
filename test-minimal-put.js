import FormData from 'form-data';
import fetch from 'node-fetch';

const testMinimalPut = async () => {
    try {
        console.log('Testing minimal PUT request...');

        // Minimal test data - only one field
        const productData = {
            title: "กล้อง DSLR Canon EOS R5 (อัปเดต)"
        };

        // Create form data
        const form = new FormData();
        
        // Add only one field
        form.append('title', productData.title);
        console.log(`Added field: title = ${productData.title}`);

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
        console.error('Error testing minimal PUT:', error);
    }
};

// Run the test
testMinimalPut(); 