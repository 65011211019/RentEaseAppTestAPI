import RentalService from '../services/rental.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const RenterController = {
    getDashboard: asyncHandler(async (req, res) => {
        const renterId = req.user.id;
        // For Day 4, this might be simple. Can be expanded later.
        const dashboardData = await RentalService.getRenterDashboardData(renterId);
        // You might want to combine with wishlist data from UserService here if needed.
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: dashboardData })
        );
    }),

    getMyRentals: asyncHandler(async (req, res) => {
        const renterId = req.user.id;
        const filters = req.validatedData || req.query; // Use validatedData if available
        const rentals = await RentalService.getRentalsForUser(renterId, 'renter', filters);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, rentals)
        );
    })
};

export default RenterController; 