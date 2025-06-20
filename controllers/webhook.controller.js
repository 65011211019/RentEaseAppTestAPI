import PaymentService from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const WebhookController = {
    handlePaymentWebhook: asyncHandler(async (req, res) => {
        // It's crucial that the raw body is available for signature verification
        // Ensure express.json() middleware is not consuming it before if your gateway needs raw body.
        // Some gateways provide signature in headers, payload in body.
        // For Day 4, we assume req.body has the parsed payload.
        const webhookPayload = req.body;
        
        // Log the received webhook for debugging
        console.log("Webhook received:", JSON.stringify(webhookPayload, null, 2));
        console.log("Webhook headers:", req.headers);

        // In a real app, verify the webhook signature here before processing
        // const signature = req.headers['x-gateway-signature']; // Example header
        // if (!PaymentService.verifyWebhookSignature(req.rawBody || JSON.stringify(webhookPayload), signature)) {
        //     throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid webhook signature.");
        // }

        const result = await PaymentService.processPaymentWebhook(webhookPayload);
        
        // Always respond with 200 OK to the gateway quickly
        res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, result, result.message || "Webhook received."));
    })
};

export default WebhookController; 