// Authentication DTOs 
import Joi from 'joi';

export const loginSchema = Joi.object({
    email_or_username: Joi.string().required().messages({
        'any.required': 'Email or username is required.',
        'string.empty': 'Email or username cannot be empty.',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required.',
        'string.empty': 'Password cannot be empty.',
    }),
});

export const requestPasswordResetSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
});

export const resetPasswordWithOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    new_password: Joi.string().min(8).required(),
    new_password_confirmation: Joi.string().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Password confirmation does not match password.',
    }),
}); 