import Joi from 'joi';

// ENUM values from DB (rental_pickup_method_enum)
const RENTAL_PICKUP_METHODS = ['self_pickup', 'delivery'];

// ENUM values from DB (rental_return_condition_status_enum)
const RETURN_CONDITION_STATUSES = ['as_rented', 'minor_wear', 'damaged', 'lost']; // 'not_yet_returned' is default

export const createRentalSchema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    start_date: Joi.date().iso().greater('now').required().messages({ // YYYY-MM-DD, must be in future
        'date.greater': 'Start date must be in the future.'
    }),
    end_date: Joi.date().iso().greater(Joi.ref('start_date')).required().messages({
        'date.greater': 'End date must be after start date.'
    }),
    pickup_method: Joi.string().valid(...RENTAL_PICKUP_METHODS).required(),
    
    // Conditional validation for delivery address
    delivery_address_id: Joi.when('pickup_method', {
        is: 'delivery',
        then: Joi.number().integer().positive().required(),
        otherwise: Joi.forbidden() // Not allowed if not delivery
    }),
    notes_from_renter: Joi.string().optional().allow(null, '')
});

// New DTOs for Day 4
export const rejectRentalSchema = Joi.object({
    reason: Joi.string().trim().min(5).max(500).required().messages({
        'string.empty': 'Reason cannot be empty.',
        'string.min': 'Reason must be at least 5 characters long.',
        'any.required': 'Reason is required.'
    })
});

export const cancelRentalSchema = Joi.object({
    reason: Joi.string().trim().min(5).max(500).required().messages({
        'string.empty': 'Reason cannot be empty.',
        'string.min': 'Reason must be at least 5 characters long.',
        'any.required': 'Reason is required.'
    })
});

export const paymentProofSchema = Joi.object({
    transaction_time: Joi.date().iso().optional().allow(null, ''), // YYYY-MM-DD HH:MM:SS or ISO string
    amount_paid: Joi.number().positive().optional().allow(null, '')
});

export const rentalListingQuerySchema = Joi.object({
    status: Joi.string().valid( // ENUM values from rental_status_enum
        'pending_owner_approval', 'pending_payment', 'confirmed', 'active',
        'return_pending', 'completed', 'cancelled_by_renter', 'cancelled_by_owner',
        'rejected_by_owner', 'dispute', 'expired', 'late_return'
    ).optional(),
    q: Joi.string().optional().allow(null, ''), // Search product title
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().min(Joi.ref('date_from')).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
});

export const returnProcessSchema = Joi.object({
    actual_return_time: Joi.date().iso().required().messages({ // YYYY-MM-DD HH:MM:SS or ISO string
        'any.required': 'Actual return time is required.'
    }),
    return_condition_status: Joi.string().valid(...RETURN_CONDITION_STATUSES).required(),
    notes_from_owner_on_return: Joi.string().trim().max(1000).optional().allow(null, ''),
    initiate_claim: Joi.boolean().default(false)
    // return_condition_images[] will be handled by multer
}); 