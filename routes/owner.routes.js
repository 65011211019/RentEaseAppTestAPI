import express from 'express';
import OwnerController from '../controllers/owner.controller.js';
import PayoutController from '../controllers/payout.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import validateRequest from '../middleware/validateRequest.js';
import { paginationSchema } from '../DTOs/common.dto.js'; // For listing products
import { rentalListingQuerySchema } from '../DTOs/rental.dto.js'; // Import rental listing schema
import { payoutMethodSchema } from '../DTOs/payout.dto.js'; // Import payout method schema
import Joi from 'joi'; // For query validation

const router = express.Router();

// All routes here are protected and specific to the logged-in owner
router.use(authenticateJWT);

router.get('/me/dashboard', OwnerController.getDashboard);

// Route to get owner's own listings
const ownerProductListQuerySchema = paginationSchema.keys({ // Define specific query for owner listings
    status: Joi.string().valid('available', 'rented_out', 'unavailable', 'pending_approval', 'rejected', 'hidden', 'draft').optional(),
    q: Joi.string().optional().allow(null, '')
});
router.get(
    '/me/products',
    validateRequest(ownerProductListQuerySchema, 'query'),
    OwnerController.getMyListings
);

// --- New Route for Day 4 ---
router.get(
    '/me/rentals',
    validateRequest(rentalListingQuerySchema, 'query'), // Use the DTO for rental listing
    OwnerController.getMyRentals
);

// Payout Methods Routes
router.get('/me/payout-methods', PayoutController.getPayoutMethods);
router.post('/me/payout-methods', validateRequest(payoutMethodSchema, 'body'), PayoutController.createPayoutMethod);
router.put('/me/payout-methods/:methodId', validateRequest(payoutMethodSchema, 'body'), PayoutController.updatePayoutMethod);
router.delete('/me/payout-methods/:methodId', PayoutController.deletePayoutMethod);
router.put('/me/payout-methods/:methodId/primary', PayoutController.setPrimaryPayoutMethod);

// Public route: Get payout methods by ownerId (for renters to see owner's bank details)
router.get('/:ownerId/payout-methods', PayoutController.getPayoutMethodsByOwnerId);

// Product CRUD operations for owner are now on /api/products but authorized.
// This file can hold other owner-specific routes like payout management (later days).

export default router; 