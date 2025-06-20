import Joi from 'joi';

export const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required().messages({
        'string.alphanum': 'Username must only contain alpha-numeric characters.',
        'string.min': 'Username must be at least 3 characters long.',
        'string.max': 'Username cannot be more than 50 characters long.',
        'any.required': 'Username is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'any.required': 'Password is required.',
    }),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password confirmation does not match password.',
        'any.required': 'Password confirmation is required.',
    }),
    first_name: Joi.string().max(100).required().messages({
        'any.required': 'First name is required.',
    }),
    last_name: Joi.string().max(100).required().messages({
        'any.required': 'Last name is required.',
    }),
    phone_number: Joi.string().max(20).optional().allow(null, ''),
});

export const updateProfileSchema = Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    phone_number: Joi.string().max(20).optional().allow(null, ''),
    address_line1: Joi.string().max(255).optional().allow(null, ''),
    address_line2: Joi.string().max(255).optional().allow(null, ''),
    city: Joi.string().max(100).optional().allow(null, ''),
    province_id: Joi.number().integer().positive().optional().allow(null),
    postal_code: Joi.string().max(10).optional().allow(null, ''),
});

export const changePasswordSchema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
    new_password_confirmation: Joi.string().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Password confirmation does not match new password.',
    }),
});

// ENUM values from DB (for user_address_type_enum)
const USER_ADDRESS_TYPES = ['shipping', 'billing', 'other'];

export const userAddressSchema = Joi.object({
    address_type: Joi.string().valid(...USER_ADDRESS_TYPES).default('shipping'),
    recipient_name: Joi.string().max(255).required(),
    phone_number: Joi.string().max(20).required(),
    address_line1: Joi.string().max(255).required(),
    address_line2: Joi.string().max(255).optional().allow(null, ''),
    sub_district: Joi.string().max(100).optional().allow(null, ''), // ตำบล/แขวง
    district: Joi.string().max(100).required(), // อำเภอ/เขต
    province_id: Joi.number().integer().positive().required(),
    postal_code: Joi.string().max(10).required(),
    is_default: Joi.boolean().optional().default(false),
    notes: Joi.string().optional().allow(null, '')
});

// ENUM values from DB (user_id_document_type_enum)
const ID_DOCUMENT_TYPES = ['national_id', 'passport', 'other'];

export const idVerificationSubmitSchema = Joi.object({
    id_document_type: Joi.string().valid(...ID_DOCUMENT_TYPES).required(),
    id_document_number: Joi.string().max(50).optional().allow(null, ''),
    // File fields (id_document_front, id_document_back, id_selfie)
    // will be handled by multer and validated for existence in the controller/service.
    // Joi schema here is for text fields sent along with files.
}); 