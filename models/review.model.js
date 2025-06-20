import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ReviewModel = {
    async create(reviewData) {
        const { data, error } = await supabase
            .from('reviews')
            .insert(reviewData)
            .select(`
                id,
                rental_id,
                rating_product,
                rating_owner,
                comment,
                created_at,
                updated_at,
                rentals (
                    id,
                    product_id,
                    renter_id,
                    owner_id,
                    products (
                        id,
                        name,
                        images
                    ),
                    users!rentals_renter_id_fkey (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .single();

        if (error) {
            console.error("Error creating review:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to create review");
        }
        return data;
    },

    async findByRentalId(rentalId) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id,
                rental_id,
                rating_product,
                rating_owner,
                comment,
                created_at,
                updated_at,
                rentals (
                    id,
                    product_id,
                    renter_id,
                    owner_id,
                    products (
                        id,
                        name,
                        images
                    ),
                    users!rentals_renter_id_fkey (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('rental_id', rentalId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        return data;
    },

    async findByProductId(productId, { page = 1, limit = 10 }) {
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error, count } = await supabase
            .from('reviews')
            .select(`
                id,
                rental_id,
                rating_product,
                rating_owner,
                comment,
                created_at,
                updated_at,
                rentals (
                    id,
                    product_id,
                    renter_id,
                    owner_id,
                    products (
                        id,
                        name,
                        images
                    ),
                    users!rentals_renter_id_fkey (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `, { count: 'exact' })
            .eq('rentals.product_id', productId)
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Error fetching product reviews:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch product reviews");
        }

        return {
            reviews: data,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    },

    async findByOwnerId(ownerId, { page = 1, limit = 10 }) {
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error, count } = await supabase
            .from('reviews')
            .select(`
                id,
                rental_id,
                rating_product,
                rating_owner,
                comment,
                created_at,
                updated_at,
                rentals (
                    id,
                    product_id,
                    renter_id,
                    owner_id,
                    products (
                        id,
                        name,
                        images
                    ),
                    users!rentals_renter_id_fkey (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `, { count: 'exact' })
            .eq('rentals.owner_id', ownerId)
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Error fetching owner reviews:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch owner reviews");
        }

        return {
            reviews: data,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }
};

export default ReviewModel; 