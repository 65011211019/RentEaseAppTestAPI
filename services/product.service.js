import ProductModel from '../models/product.model.js';
import ReviewModel from '../models/review.model.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import slugify from 'slugify';
// Import Supabase client - trying different import styles
import supabaseClient from '../db/supabaseClient.js'; 
// Or if it's a named export:
// import { client as supabaseClient } from '../db/supabaseClient.js'; 
// import { supabase as supabaseClient } from '../db/supabaseClient.js'; 

import path from 'path'; // To handle file paths
import { v4 as uuidv4 } from 'uuid'; // To generate unique filenames

// Use the imported client
const supabase = supabaseClient; // Assign the imported client to a variable named supabase

const ProductService = {
    async getProducts(filters) {
        const { products, total } = await ProductModel.findAll(filters);
        return {
            data: products,
            meta: {
                current_page: parseInt(filters.page, 10) || 1,
                per_page: parseInt(filters.limit, 10) || 10,
                total: total,
                last_page: Math.ceil(total / (parseInt(filters.limit, 10) || 10)),
                from: total > 0 ? ((parseInt(filters.page, 10) || 1) - 1) * (parseInt(filters.limit, 10) || 10) + 1 : 0,
                to: total > 0 ? Math.min(total, (parseInt(filters.page, 10) || 1) * (parseInt(filters.limit, 10) || 10)) : 0,
            },
            links: {
                first: `/api/products?page=1&limit=${filters.limit || 10}`,
                last: `/api/products?page=${Math.ceil(total / (filters.limit || 10))}&limit=${filters.limit || 10}`,
                prev: (filters.page || 1) > 1 ? `/api/products?page=${(filters.page || 1) - 1}&limit=${filters.limit || 10}` : null,
                next: (filters.page || 1) < Math.ceil(total / (filters.limit || 10)) ? `/api/products?page=${(filters.page || 1) + 1}&limit=${filters.limit || 10}` : null,
            }
        };
    },

    async getProductDetails(identifier) {
        const product = await ProductModel.findByIdOrSlug(identifier);
        if (!product) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
        }
        return product;
    },

    async getProductAvailability(productId, yearMonth) {
        const bookedDates = await ProductModel.getProductAvailability(productId, yearMonth);
        return { booked_dates: bookedDates };
    },

    async getProductReviews(productId, queryParams) {
        const { reviews, total } = await ReviewModel.findByProductId({
            productId,
            ...queryParams
        });
        return {
            data: reviews,
            meta: {
                current_page: parseInt(queryParams.page, 10) || 1,
                per_page: parseInt(queryParams.limit, 10) || 5,
                total: total,
                last_page: Math.ceil(total / (parseInt(queryParams.limit, 10) || 5)),
            }
        };
    },

    async createProduct(ownerId, productData, productImages) {
        if (!productData || !productData.title) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Product data is required");
        }

        // Generate slug from title
        let slug = slugify(productData.title, {
            lower: true,
            strict: true,
            // locale: 'en' // Remove or change locale if slugify supports other languages
        });

        // If slug is empty or potentially non-unique (e.g., from non-ASCII chars), append a unique part
        if (!slug || slug.trim() === '') {
             slug = `product-${uuidv4()}`; // Use a generic prefix + UUID
        } else {
            // Optional: Add a short unique suffix to generated slugs to further minimize collision risk,
            // especially for titles that might produce the same slug after slugify.
            // slug = `${slug}-${uuidv4().substring(0, 4)}`; // Example: append first 4 chars of UUID
        }

        const imageUrls = [];

        // Upload images to Supabase Storage if files are provided
        if (productImages && Array.isArray(productImages) && productImages.length > 0) {
            console.log(`Uploading ${productImages.length} images for product`);
            
            for (const file of productImages) {
                if (!file || !file.buffer) {
                    console.warn('Skipping invalid file:', file);
                    continue;
                }
                
                const fileExtension = path.extname(file.originalname);
                // It's better to use a unique name + original name part or just a unique name
                // const fileName = `${uuidv4()}${fileExtension}`; // Old way: just UUID
                
                // New way: incorporate a sanitized version of the original filename and a UUID part for uniqueness
                const sanitizedOriginalName = slugify(path.parse(file.originalname).name, { lower: true, strict: true });
                const fileName = `${sanitizedOriginalName || 'upload'}-${uuidv4()}${fileExtension}`; 

                const filePath = `public/${ownerId}/${fileName}`; // Define the path in the bucket (e.g., public/ownerId/unique_filename.ext)

                console.log(`Uploading file: ${fileName} to path: ${filePath}`);

                const { data, error } = await supabase.storage
                    .from('product-images') // Your Supabase bucket name
                    .upload(filePath, file.buffer, {
                        cacheControl: '3600',
                        upsert: false // Don't overwrite existing files with the same name
                    });

                if (error) {
                    console.error("Error uploading file to Supabase:", error);
                    // TODO: Implement rollback logic to delete previously uploaded files for this product
                    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload product image.");
                }

                const { publicUrl } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath).data;

                console.log(`Successfully uploaded: ${publicUrl}`);
                imageUrls.push(publicUrl);
            }
        } else {
            console.log('No images provided for product');
        }

        const productWithOwner = {
            ...productData,
            owner_id: ownerId,
            slug,
            admin_approval_status: 'approved',
            availability_status: 'available',
            image_urls: imageUrls
        };

        const newProduct = await ProductModel.create(productWithOwner);
        if (!newProduct) {
             // This case should ideally be caught by the error check inside ProductModel.create
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to create product record.");
        }

        return newProduct;
    },

    async getOwnerProducts(ownerId, filters) {
        const result = await ProductModel.findByOwnerId(ownerId, filters);
        return result;
    },

    async updateProduct(identifier, ownerId, updatedProductData, newImages, removeImageIds) {
        // 1. Find the existing product to verify ownership and get current image info
        const existingProduct = await ProductModel.findByIdOrSlug(identifier);

        if (!existingProduct || existingProduct.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or does not belong to the owner.");
        }

        // 2. Handle image deletion
        if (removeImageIds && removeImageIds.length > 0) {
             // Get the file paths of images to remove from Supabase Storage
            const imagesToDelete = existingProduct.images.filter(img => removeImageIds.includes(img.id));
            const filePathsToDelete = imagesToDelete.map(img => {
                 // Extract file path from the Supabase public URL
                const urlParts = img.image_url.split('/');
                // The path in storage starts after 'storage/v1/object/public/bucket-name/'
                const pathInStorage = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
                return pathInStorage;
            });

            if (filePathsToDelete.length > 0) {
                const { error: deleteStorageError } = await supabase.storage
                    .from('product-images')
                    .remove(filePathsToDelete);

                if (deleteStorageError) {
                    console.error("Error deleting images from Supabase Storage:", deleteStorageError);
                    // Continue with DB deletion if storage deletion fails, or throw error?
                    // For now, we log and continue to attempt DB deletion.
                }
            }

            // Delete image records from the database
            const { error: deleteDbError } = await supabase
                .from('product_images')
                .delete()
                .in('id', removeImageIds);

            if (deleteDbError) {
                 console.error("Error deleting image records from database:", deleteDbError);
                 throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete product images.");
            }
        }

        // 3. Handle new image uploads
        const newImageUrls = [];
        if (newImages && newImages.length > 0) {
            for (const file of newImages) {
                 const fileExtension = path.extname(file.originalname);
                 const sanitizedOriginalName = slugify(path.parse(file.originalname).name, { lower: true, strict: true });
                 const fileName = `${sanitizedOriginalName || 'upload'}-${uuidv4()}${fileExtension}`; 
                 const filePath = `public/${ownerId}/${fileName}`;

                 const { data, error } = await supabase.storage
                     .from('product-images')
                     .upload(filePath, file.buffer, {
                         cacheControl: '3600',
                         upsert: false
                     });

                 if (error) {
                     console.error("Error uploading new image to Supabase:", error);
                     // TODO: Implement rollback for images already uploaded in this request
                     throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload new product image.");
                 }

                 const { publicUrl } = supabase.storage
                     .from('product-images')
                     .getPublicUrl(filePath).data;

                 newImageUrls.push(publicUrl);
            }
             // Prepare new image records for insertion into product_images table
             const newImageRecordsToInsert = newImageUrls.map((url, index) => ({
                 product_id: existingProduct.id, // Link to the existing product
                 image_url: url,
                 alt_text: '', // Default alt text
                 is_primary: false, // Determine primary status later if needed
                 sort_order: existingProduct.images.length + index // Append to existing images
             }));

             // Insert new image records into the database
             if (newImageRecordsToInsert.length > 0) {
                 const { error: insertNewImageError } = await supabase
                     .from('product_images')
                     .insert(newImageRecordsToInsert);

                 if (insertNewImageError) {
                     console.error("Error inserting new image records:", insertNewImageError);
                      // TODO: Implement rollback for uploaded files if DB insertion fails
                     throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to save new product images.");
                 }
             }
        }

        // 4. Handle product data update (excluding image_urls as it's managed separately)
        // Filter out image_urls and any other fields not directly in products table if necessary
        const productDataToUpdate = { ...updatedProductData };
        delete productDataToUpdate.image_urls; // Ensure image_urls is not attempted to be updated in products table

        console.log('Product data to update:', productDataToUpdate);
        console.log('Existing product ID:', existingProduct.id);
        console.log('Owner ID:', ownerId);

        // If title is updated, regenerate slug (optional, depends on requirements)
        if (productDataToUpdate.title && productDataToUpdate.title !== existingProduct.title) {
             let newSlug = slugify(productDataToUpdate.title, { lower: true, strict: true });
             if (!newSlug || newSlug.trim() === '') {
                 newSlug = `product-${uuidv4()}`; 
             }
             productDataToUpdate.slug = newSlug;
             console.log('Generated new slug:', newSlug);
        }

        // Check if there's any data to update
        if (Object.keys(productDataToUpdate).length === 0) {
            console.log('No product data to update, skipping database update');
        } else {
            const { data: updatedProductDataResult, error: updateProductError } = await supabase
                .from('products')
                .update(productDataToUpdate)
                .eq('id', existingProduct.id) // Update by product ID
                .eq('owner_id', ownerId) // Ensure ownership for update
                .select('id') // Select ID to confirm update
                .single();

            if (updateProductError) {
                console.error("Error updating product record:", updateProductError);
                console.error("Error details:", {
                    message: updateProductError.message,
                    details: updateProductError.details,
                    hint: updateProductError.hint,
                    code: updateProductError.code
                });
                throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to update product record: ${updateProductError.message}`);
            }

            if (!updatedProductDataResult) {
                console.error("No product was updated - product not found or ownership mismatch");
                throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or does not belong to the owner.");
            }

            console.log('Product updated successfully:', updatedProductDataResult);
        }

        // 5. Fetch and return the updated product details
        const updatedProduct = await ProductModel.findByIdOrSlug(existingProduct.id); // Fetch using ID after update

        if (!updatedProduct) {
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve updated product details.");
        }

        return updatedProduct;
    },

    async updateProductStatus(productId, ownerId, availabilityStatus) {
        // 1. Find the existing product to verify ownership
        const existingProduct = await ProductModel.findByIdOrSlug(productId);

        if (!existingProduct || existingProduct.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or does not belong to the owner.");
        }

        // 2. Update the availability_status
        const { data: updatedProductData, error } = await supabase
            .from('products')
            .update({ availability_status: availabilityStatus })
            .eq('id', productId)
            .eq('owner_id', ownerId)
            .select()
            .single();

        if (error || !updatedProductData) {
            console.error("Error updating product status:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to update product status.");
        }

        // 3. Return the updated product
        return updatedProductData;
    },

    async deleteProductImage(productId, imageId, ownerId) {
        // 1. Find the existing product to verify ownership
        const existingProduct = await ProductModel.findByIdOrSlug(productId);

        if (!existingProduct || existingProduct.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or does not belong to the owner.");
        }

        // 2. Find the image to delete
        // Ensure imageId is treated as a number for comparison
        const imageIdInt = parseInt(imageId, 10);
        const imageToDelete = existingProduct.images.find(img => img.id === imageIdInt);

        if (!imageToDelete) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Image not found.");
        }

        // 3. Delete the image from Supabase Storage
        const urlParts = imageToDelete.image_url.split('/');
        const pathInStorage = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
        const { error: deleteStorageError } = await supabase.storage
            .from('product-images')
            .remove([pathInStorage]);

        if (deleteStorageError) {
            console.error("Error deleting image from Supabase Storage:", deleteStorageError);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete product image.");
        }

        // 4. Delete the image record from the database
        const { error: deleteDbError } = await supabase
            .from('product_images')
            .delete()
            .eq('id', imageIdInt);

        if (deleteDbError) {
            console.error("Error deleting image record from database:", deleteDbError);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete product image.");
        }

        // 5. Fetch and return the updated product details
        const updatedProduct = await ProductModel.findByIdOrSlug(existingProduct.id); // Fetch using ID after update

        if (!updatedProduct) {
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve updated product details.");
        }

        return updatedProduct;
    },

    async deleteProduct(productId, ownerId) {
        // 1. Find the existing product to verify ownership
        const existingProduct = await ProductModel.findByIdOrSlug(productId);

        if (!existingProduct || existingProduct.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found or does not belong to the owner.");
        }

        // 2. Delete images from Supabase Storage
        const imagePathsToDelete = existingProduct.images
            .map(img => {
                // Extract file path from the Supabase public URL
                const urlParts = img.image_url.split('/');
                // The path in storage starts after 'storage/v1/object/public/bucket-name/'
                // Ensure the bucket name is correctly extracted and used for slicing
                const bucketIndex = urlParts.indexOf('product-images'); // Find the index of the bucket name
                if (bucketIndex === -1 || bucketIndex >= urlParts.length - 1) {
                    console.error(`Could not extract storage path from URL: ${img.image_url}`);
                    return null; // Return null for invalid URLs
                }
                return urlParts.slice(bucketIndex + 1).join('/');
            })
            .filter(path => path !== null); // Filter out null values from invalid URLs

        if (imagePathsToDelete.length > 0) {
            const { error: deleteStorageError } = await supabase.storage
                .from('product-images') // Your Supabase bucket name
                .remove(imagePathsToDelete);

            if (deleteStorageError) {
                console.error("Error deleting images from Supabase Storage:", deleteStorageError);
                // Continue with DB deletion if storage deletion fails, or throw error?
                // For now, we log and continue to attempt DB deletion.
            }
        }

        // 3. Delete the product record from the database
        // Delete related records first if necessary (e.g., rentals, reviews)
        // For now, assuming CASCADE DELETE is set up in DB for product_images

        const { error: deleteDbError } = await supabase
            .from('products')
            .delete()
            .eq('id', existingProduct.id)
            .eq('owner_id', ownerId);

        if (deleteDbError) {
            console.error("Error deleting product record from database:", deleteDbError);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete product record.");
        }

        // No need to return the deleted product
        return null; // Indicate successful deletion
    }
};

export default ProductService; 