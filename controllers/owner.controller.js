import OwnerService from '../services/owner.service.js';
import RentalService from '../services/rental.service.js'; // For owner's rentals
import ProductService from '../services/product.service.js'; // For listing owner's products
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import validateRequest from '../middleware/validateRequest.js';
import { paginationSchema } from '../DTOs/common.dto.js'; // For listing products
import Joi from 'joi'; // For simple query validation

const ownerProductListQuerySchema = paginationSchema.keys({
    status: Joi.string().optional(), // e.g. 'available', 'rented_out'
    q: Joi.string().optional().allow(null, '')
});

const OwnerController = {
    getDashboard: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const stats = await OwnerService.getOwnerDashboardStats(ownerId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: stats })
        );
    }),

    getMyListings: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        // req.query is already validated by validateRequest for pagination and other filters
        const result = await ProductService.getOwnerProducts(ownerId, req.validatedData || req.query);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result)
        );
    }),

    // --- New Handler for Day 4 ---
    getMyRentals: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const filters = req.validatedData || req.query; // Use validatedData if available
        const rentals = await RentalService.getRentalsForUser(ownerId, 'owner', filters);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, rentals)
        );
    }),

    // Product specific actions (create, update, delete, update status)
    // are now better placed in ProductController but authenticated for owner.
    // This controller can be for owner-specific aggregated views or settings.
};

export default OwnerController; 