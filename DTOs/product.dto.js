import Joi from 'joi';
import { paginationSchema } from './common.dto.js';

export const getProductsQuerySchema = paginationSchema.keys({ // Inherit pagination
    q: Joi.string().optional().allow(null, ''), // Search query
    featured: Joi.boolean().optional(),
    category_id: Joi.number().integer().positive().optional(),
    province_ids: Joi.string().optional().custom((value, helpers) => { // Comma-separated string of IDs
        if (!value) return undefined;
        const ids = value.split(',').map(id => parseInt(id.trim(), 10));
        if (ids.some(isNaN) || ids.some(id => id <= 0)) {
            return helpers.error('any.invalid', { message: 'province_ids must be a comma-separated list of positive integers' });
        }
        return ids;
    }, 'Comma-separated positive integers').optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(Joi.ref('min_price', { adjust: val => val || 0 })).optional(), // max_price >= min_price
    sort: Joi.string().valid( // Define valid sort options
        'created_at_desc', 'created_at_asc',
        'price_asc', 'price_desc',
        'rating_desc', 'rating_asc',
        'views_desc', 'views_asc',
        'updated_at_desc', 'updated_at_asc'
    ).default('updated_at_desc').optional(),
    // Availability (for product detail page)
    month: Joi.string().regex(/^\d{4}-\d{2}$/).optional().messages({ // YYYY-MM
        'string.pattern.base': 'Month must be in YYYY-MM format'
    }),
    // Add validation for remove_image_ids
    remove_image_ids: Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.array().items(Joi.string(), Joi.number().integer().positive()).single()
    ).optional().allow(null, '').custom((value, helpers) => {
        if (value === null || value === '') return undefined;

        let stringValue;
        if (Array.isArray(value)) {
            // If it's an array, join elements into a comma-separated string
            stringValue = value.join(',');
        } else {
            // Otherwise, assume it's already a string
            stringValue = value;
        }

        const ids = stringValue.split(',').map(id => parseInt(id.trim(), 10));
        if (ids.some(isNaN) || ids.some(id => id <= 0)) {
            return helpers.error('any.invalid', { message: 'remove_image_ids must be a comma-separated list of positive integers' });
        }
        return ids;
    }, 'Comma-separated positive integers').optional()
});

export const getProductReviewsQuerySchema = paginationSchema.keys({
    sort: Joi.string().valid(
        'created_at_desc', 'created_at_asc',
        'rating_desc', 'rating_asc'
    ).default('created_at_desc').optional(),
});

// ENUM values from DB (product_availability_status_enum)
const PRODUCT_AVAILABILITY_STATUSES_FOR_OWNER = ['available', 'unavailable', 'hidden']; // Owner can set these

export const productBaseSchema = { // Base fields for create and edit
    title: Joi.string().max(255).required(),
    category_id: Joi.number().integer().positive().required(),
    province_id: Joi.number().integer().positive().required(),
    description: Joi.string().required(),
    specifications: Joi.object().optional().allow(null), // JSONB
    rental_price_per_day: Joi.number().precision(2).positive().required(),
    rental_price_per_week: Joi.number().precision(2).positive().optional().allow(null),
    rental_price_per_month: Joi.number().precision(2).positive().optional().allow(null),
    security_deposit: Joi.number().precision(2).min(0).default(0.00),
    quantity: Joi.number().integer().min(1).default(1),
    min_rental_duration_days: Joi.number().integer().min(1).default(1),
    max_rental_duration_days: Joi.number().integer().min(Joi.ref('min_rental_duration_days')).optional().allow(null),
    address_details: Joi.string().max(255).optional().allow(null, ''),
    latitude: Joi.number().precision(8).min(-90).max(90).optional().allow(null),
    longitude: Joi.number().precision(8).min(-180).max(180).optional().allow(null),
    condition_notes: Joi.string().optional().allow(null, ''),
    // availability_status is managed by a separate endpoint for owner
};

export const createProductSchema = Joi.object(productBaseSchema);

export const updateProductSchema = Joi.object({
    ...productBaseSchema,
    // Make all fields optional for update
    title: Joi.string().max(255).optional(),
    category_id: Joi.number().integer().positive().optional(),
    province_id: Joi.number().integer().positive().optional(),
    description: Joi.string().optional(),
    rental_price_per_day: Joi.number().precision(2).positive().optional(),
    quantity: Joi.number().integer().min(0).optional(), // Allow 0 if product becomes unavailable
    min_rental_duration_days: Joi.number().integer().min(1).optional(),
    max_rental_duration_days: Joi.number().integer().min(Joi.ref('min_rental_duration_days')).optional().allow(null),
    address_details: Joi.string().max(255).optional().allow(null, ''),
    latitude: Joi.number().precision(8).min(-90).max(90).optional().allow(null),
    longitude: Joi.number().precision(8).min(-180).max(180).optional().allow(null),
    condition_notes: Joi.string().optional().allow(null, ''),
    
    // Add validation for remove_image_ids
    remove_image_ids: Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.array().items(Joi.string(), Joi.number().integer().positive()).single()
    ).optional().allow(null, '').custom((value, helpers) => {
        if (value === null || value === '') return undefined;

        let stringValue;
        if (Array.isArray(value)) {
            // If it's an array, join elements into a comma-separated string
            stringValue = value.join(',');
        } else {
            // Otherwise, assume it's already a string
            stringValue = value;
        }

        const ids = stringValue.split(',').map(id => parseInt(id.trim(), 10));
        if (ids.some(isNaN) || ids.some(id => id <= 0)) {
            return helpers.error('any.invalid', { message: 'remove_image_ids must be a comma-separated list of positive integers' });
        }
        return ids;
    }, 'Comma-separated positive integers').optional()
});

export const updateProductStatusSchema = Joi.object({
    availability_status: Joi.string().valid(...PRODUCT_AVAILABILITY_STATUSES_FOR_OWNER).required()
}); 