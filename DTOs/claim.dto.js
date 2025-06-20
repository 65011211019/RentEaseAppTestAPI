import Joi from 'joi';

// ENUM values from DB (claim_type_enum)
const CLAIM_TYPES = ['damage', 'loss', 'other'];

export const createClaimSchema = Joi.object({
    rental_id: Joi.number().integer().positive().required(),
    claim_type: Joi.string().valid(...CLAIM_TYPES).required(),
    claim_details: Joi.string().trim().min(10).max(2000).required(),
    requested_amount: Joi.number().precision(2).min(0).optional().allow(null)
    // attachments[] will be handled by multer
});

export const respondToClaimSchema = Joi.object({ // Renter's response
    response_details: Joi.string().trim().min(10).max(2000).required()
    // attachments[] will be handled by multer
});

// For Admin update (Day 7/8)
// export const adminUpdateClaimSchema = Joi.object({ ... }); 