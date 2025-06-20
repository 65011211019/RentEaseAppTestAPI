import Joi from 'joi';

export const createReviewSchema = Joi.object({
    rental_id: Joi.number().integer().positive().required(),
    rating_product: Joi.number().integer().min(1).max(5).required(),
    rating_owner: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(1000).optional().allow(null, '')
}); 