import supabase from '../db/supabaseClient.js';

const ProductImageModel = {
    async findByProductId(productId) {
        const { data, error } = await supabase
            .from('product_images')
            .select('id, image_url, alt_text, is_primary, sort_order')
            .eq('product_id', productId)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

        if (error) {
            console.error("Error fetching product images:", error);
            throw error;
        }
        return data;
    },

    async findPrimaryImageByProductId(productId) {
        const { data, error } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', productId)
            .eq('is_primary', true)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching primary product image:", error);
            throw error;
        }
        return data;
    }
};

export default ProductImageModel; 