import express from 'express';
import RenterController from '../controllers/renter.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js'; // or verifyJWT
import validateRequest from '../middleware/validateRequest.js';
import { rentalListingQuerySchema } from '../DTOs/rental.dto.js'; // DTO for rental listing

const router = express.Router();
router.use(authenticateJWT);

router.get(
    '/me/dashboard',
    RenterController.getDashboard
);

router.get(
    '/me/rentals',
    validateRequest(rentalListingQuerySchema, 'query'),
    RenterController.getMyRentals
);

export default router; 