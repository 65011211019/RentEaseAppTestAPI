import Joi from 'joi';

// Example payment method types (align with your payment gateway options)
const PAYMENT_METHOD_TYPES = ['credit_card', 'promptpay_qr', 'bank_transfer'];

export const initiatePaymentSchema = Joi.object({
    payment_method_type: Joi.string().valid(...PAYMENT_METHOD_TYPES).required()
}); 