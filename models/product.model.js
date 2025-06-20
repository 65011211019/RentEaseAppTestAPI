import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ProductModel = {
    async findAll(filters = {}) {
        const {
            q,
            featured,
            category_id,
            province_ids,
            min_price,
            max_price,
            sort = 'updated_at_desc',
            page = 1,
            limit = 10
        } = filters;

        const offset = (page - 1) * limit;

        let query = supabase
            .from('products')
            .select(`
                id, title, slug, rental_price_per_day, average_rating, total_reviews, view_count,
                province:provinces (id, name_th),
                category:categories (id, name),
                primary_image:product_images (image_url)
            `, { count: 'exact' })
            .eq('admin_approval_status', 'approved')
            .eq('availability_status', 'available')
            .is('deleted_at', null);

        if (featured) {
            query = query.eq('is_featured', true);
        }
        if (q) {
            query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
        }
        if (category_id) {
            query = query.eq('category_id', category_id);
        }
        if (province_ids && province_ids.length > 0) {
            query = query.in('province_id', province_ids);
        }
        if (min_price !== undefined) {
            query = query.gte('rental_price_per_day', min_price);
        }
        if (max_price !== undefined) {
            query = query.lte('rental_price_per_day', max_price);
        }

        query = query.eq('primary_image.is_primary', true);

        const [sortFieldDb, sortOrderDb] = sort.split('_');
        let actualSortField = sortFieldDb;
        if (sortFieldDb === 'price') actualSortField = 'rental_price_per_day';
        if (sortFieldDb === 'rating') actualSortField = 'average_rating';
        if (sortFieldDb === 'views') actualSortField = 'view_count';
        if (sortFieldDb === 'updated') actualSortField = 'updated_at';
        if (sortFieldDb === 'created') actualSortField = 'created_at';
        if (sortFieldDb === 'newest') actualSortField = 'created_at';

        query = query.order(actualSortField, { ascending: sortFieldDb === 'newest' ? false : sortOrderDb === 'asc' });
        if (actualSortField !== 'id') {
            query = query.order('id', { ascending: true });
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching products:", error);
            throw error;
        }

        const products = data.map(p => ({
            ...p,
            primary_image: p.primary_image && p.primary_image.length > 0 ? p.primary_image[0] : { image_url: null },
            category: p.category || null
        }));

        return { products, total: count };
    },

    async findByIdOrSlug(identifier) {
        const isNumericId = /^\d+$/.test(identifier);
        let matchField = isNumericId ? 'id' : 'slug';
        let matchValue = isNumericId ? parseInt(identifier, 10) : identifier;

        // RLS Policy Note: This function is intended for fetching publicly viewable products (approved and available)
        // View count increment only for successfully retrieved (approved) products
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select(`
                *,
                province:provinces (id, name_th, name_en),
                category:categories (id, name, slug, description),
                owner:users!fk_products_owner (id, first_name, last_name, profile_picture_url, created_at),
                images:product_images (id, image_url, alt_text, is_primary, sort_order)
            `)
            .eq(matchField, matchValue)
            .eq('admin_approval_status', 'approved')
            .is('deleted_at', null)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'No rows found'
            console.error(`Error fetching product by ${matchField}:`, fetchError);
            throw fetchError;
        }
        if (!product) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or not approved.");
        }

         // Increment view count after successful fetch for an approved product
        if (product.id) {
             supabase
                .rpc('increment_view_count', { 
                    p_id_input: product.id,
                    p_slug_input: null // Assuming RPC handles ID or slug, but ID is safer here
                 })
                .then(({ error: rpcError }) => {
                    if (rpcError) console.error("Error incrementing view_count:", rpcError);
                });
        }

        if (product.images) {
            product.images.sort((a, b) => {
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return 1;
                return a.sort_order - b.sort_order;
            });
        } else {
            product.images = [];
        }

        return product;
    },

    async getProductAvailability(productId, yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('rentals')
            .select('start_date, end_date')
            .eq('product_id', productId)
            .in('rental_status', ['pending_owner_approval', 'pending_payment', 'confirmed', 'active'])
            .lte('start_date', monthEnd)
            .gte('end_date', monthStart);

        if (error) {
            console.error("Error fetching product availability:", error);
            throw error;
        }

        const bookedDates = [];
        if (data) {
            data.forEach(rental => {
                let currentDate = new Date(rental.start_date + 'T00:00:00Z');
                const endDate = new Date(rental.end_date + 'T00:00:00Z');

                while (currentDate <= endDate) {
                    const currentDateStr = currentDate.toISOString().split('T')[0];
                    if (currentDateStr >= monthStart && currentDateStr <= monthEnd && !bookedDates.includes(currentDateStr)) {
                        bookedDates.push(currentDateStr);
                    }
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                }
            });
        }
        return bookedDates.sort();
    },

    async create(productData) {
        // Separate image_urls from productData
        const { image_urls, ...productToInsert } = productData;

        console.log("Attempting to insert product data:", productToInsert); // Log data being inserted

        // Insert product into the products table
        const { data: newProductData, error: productError } = await supabase
            .from('products')
            .insert(productToInsert)
            .select('id') // Select only the ID of the newly created product
            .single();

        if (productError || !newProductData) {
            console.error("Error creating product record:", productError); // Log the actual Supabase error object
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to create product record in database.");
        }

        const newProductId = newProductData.id;
        const imagesToInsert = [];

        // Prepare image data for insertion into product_images table
        if (image_urls && image_urls.length > 0) {
            image_urls.forEach((imageUrl, index) => {
                imagesToInsert.push({
                    product_id: newProductId,
                    image_url: imageUrl,
                    alt_text: '', // Default alt text (can be added later)
                    is_primary: index === 0, // Set the first image as primary
                    sort_order: index // Set sort order
                });
            });

            // Insert image data into the product_images table
            const { error: imageError } = await supabase
                .from('product_images')
                .insert(imagesToInsert);

            if (imageError) {
                console.error("Error inserting product images:", imageError); // Log image insertion error
                // Note: In a production app, you might want to delete the created product here
                // to avoid orphaned product records without images.
                throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to save product images.");
            }
        }

        // Fetch the newly created product details by ID without the approval status filter
        const { data: createdProduct, error: fetchCreatedError } = await supabase
            .from('products')
            .select(`
                *,
                province:provinces (id, name_th, name_en),
                category:categories (id, name, slug, description),
                owner:users!fk_products_owner (id, first_name, last_name, profile_picture_url, created_at),
                images:product_images (id, image_url, alt_text, is_primary, sort_order)
            `)
            .eq('id', newProductId)
            .maybeSingle();

         if (fetchCreatedError || !createdProduct) {
             console.error("Error fetching created product details:", fetchCreatedError);
             throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve created product details.");
        }

        // Sort images for the returned product object
        if (createdProduct.images) {
            createdProduct.images.sort((a, b) => {
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return 1;
                return a.sort_order - b.sort_order;
            });
        } else {
            createdProduct.images = [];
        }

        return createdProduct;
    },

    async findByOwnerId(ownerId, filters = {}) {
        const { page = 1, limit = 10, status, q } = filters;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('products')
            .select(`
                *,
                province:provinces (id, name_th, name_en),
                category:categories (id, name),
                images:product_images (id, image_url, alt_text, is_primary)
            `, { count: 'exact' })
            .eq('owner_id', ownerId)
            .is('deleted_at', null);

        if (status) {
            query = query.eq('availability_status', status); // Filter by availability_status or admin_approval_status?
            // Based on ownerProductListQuerySchema, it seems to filter by availability_status
            // If filtering by admin_approval_status is also needed, schema and query should be adjusted.
        }
        
        if (q) {
             query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
        }

        // Default sort for owner products? Maybe by creation date or update date?
        // For now, let's add a default sort.
        query = query.order('created_at', { ascending: false });

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching owner products:", error);
            throw error;
        }

        // Process images to ensure primary image is at the front if needed
        const products = data.map(p => {
            if (p.images) {
                 p.images.sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0));
            } else {
                 p.images = [];
            }
            return p;
        });

        return {
            data: products,
            meta: {
                current_page: page,
                per_page: limit,
                total: count,
                last_page: Math.ceil(count / limit),
                from: count > 0 ? offset + 1 : 0,
                to: count > 0 ? Math.min(count, offset + limit) : 0,
            },
             links: {
                // Links can be added here similar to findAll if needed
            }
        };
    }
};

export default ProductModel; 