import supabase from '../db/supabaseClient.js';

const WishlistModel = {
    async addToWishlist(userId, productId) {
        const { data, error } = await supabase
            .from('wishlist')
            .insert({ user_id: userId, product_id: productId })
            .select()
            .single();

        if (error && error.code === '23505') {
            return { message: "Item already in wishlist." };
        }
        if (error) {
            console.error("Error adding to wishlist:", error);
            throw error;
        }
        return data;
    },

    async removeFromWishlist(userId, productId) {
        const { data, error } = await supabase
            .from('wishlist')
            .delete()
            .match({ user_id: userId, product_id: productId });

        if (error) {
            console.error("Error removing from wishlist:", error);
            throw error;
        }
        return data;
    },

    async getWishlistStatus(userId, productId) {
        const { data, error, count } = await supabase
            .from('wishlist')
            .select('*', { count: 'exact', head: true })
            .match({ user_id: userId, product_id: productId });

        if (error) {
            console.error("Error checking wishlist status:", error);
            throw error;
        }
        return { wished: count > 0 };
    },

    async getUserWishlist(userId, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('wishlist')
            .select(`
                added_at,
                product:products (
                    id, title, slug, rental_price_per_day,
                    primary_image:product_images (image_url)
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .eq('product.primary_image.is_primary', true)
            .order('added_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error("Error fetching user wishlist:", error);
            throw error;
        }

        const wishlistItems = data.map(item => ({
            ...item,
            product: {
                ...item.product,
                primary_image: item.product.primary_image && item.product.primary_image.length > 0 
                               ? item.product.primary_image[0] 
                               : { image_url: null }
            }
        }));

        return { items: wishlistItems, total: count };
    }
};

export default WishlistModel; 