import express from 'express';
import ProductController from '../controllers/product.controller.js';
import ReviewController from '../controllers/review.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import { getProductsQuerySchema, getProductReviewsQuerySchema, createProductSchema, updateProductSchema, updateProductStatusSchema } from '../DTOs/product.dto.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import parseSpecifications from '../middleware/parseSpecifications.js';
import { uploadMultipleFields } from '../middleware/fileUpload.js';
import Joi from 'joi';

const router = express.Router();

// Log request body for debugging
router.use((req, res, next) => {
    console.log('Product Router Request Body:', req.body);
    console.log('Product Router Request Files:', req.files); // Enable file debugging
    next();
});

// Public routes
router.get(
    '/',
    validateRequest(getProductsQuerySchema, 'query'),
    ProductController.getAllProducts
);

router.get(
    '/:product_slug_or_id',
    ProductController.getProductByIdOrSlug
);

router.get(
    '/:productId/availability',
    validateRequest(
        Joi.object({
            month: Joi.string().regex(/^\d{4}-\d{2}$/).required().messages({
                'string.pattern.base': 'Month must be in YYYY-MM format',
                'any.required': 'Month query parameter is required (YYYY-MM)'
            })
        }),
        'query'
    ),
    ProductController.getProductAvailability
);

router.get(
    '/:productId/reviews',
    validateRequest(getProductReviewsQuerySchema, 'query'),
    ReviewController.getProductReviews
);

// Protected routes (require authentication)
router.post(
    '/',
    authenticateJWT,
    uploadMultipleFields([{ name: 'images[]', maxCount: 10 }]), // Use proper fileUpload middleware
    parseSpecifications, 
    validateRequest(createProductSchema, 'body'),
    ProductController.createProduct
);

// PUT route to update a product
router.put(
    '/:product_slug_or_id',
    authenticateJWT, 
    uploadMultipleFields([
        { name: 'new_images[]', maxCount: 10 } // Only handle file fields here
    ]),
    parseSpecifications, // Parse specifications from string if included
    validateRequest(updateProductSchema, 'body'), // Validate request body with update schema
    ProductController.updateProduct 
);

// PUT route to update product availability status
router.put(
    '/:productId/status',
    authenticateJWT,
    validateRequest(updateProductStatusSchema, 'body'),
    ProductController.updateProductStatus // We will create this controller function next
);

// DELETE route to remove a product image
router.delete(
    '/:productId/images/:imageId',
    authenticateJWT,
    ProductController.deleteProductImage // We will create this controller function next
);

// DELETE route to remove a product
router.delete(
    '/:productId',
    authenticateJWT,
    ProductController.deleteProduct // We will create this controller function next
);

export default router; 