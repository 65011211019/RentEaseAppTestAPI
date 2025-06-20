import express from 'express';
import WebhookController from '../controllers/webhook.controller.js';

const router = express.Router();

// This route should ideally have a middleware to capture raw body if needed for signature verification,
// and bypass express.json() for this specific route if the gateway sends non-JSON or needs raw.
// For now, we assume gateway sends JSON and signature is in header.

// Example: If gateway sends urlencoded form data
// router.post('/payment-gateway', express.urlencoded({ extended: true, verify: ... capture raw body ... }), WebhookController.handlePaymentWebhook);

router.post(
    '/payment-gateway', // The URL your payment gateway will send POST requests to
    WebhookController.handlePaymentWebhook
);

export default router; 