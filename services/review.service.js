import ReviewModel from '../models/review.model.js';
import RentalModel from '../models/rental.model.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ReviewService = {
    async createReview(userId, reviewData) {
        // Verify the rental exists and belongs to the user
        const rental = await RentalModel.findById(reviewData.rental_id);
        if (!rental) {
            throw new ApiError(
                httpStatusCodes.NOT_FOUND,
                "Rental not found"
            );
        }

        if (rental.renter_id !== userId) {
            throw new ApiError(
                httpStatusCodes.FORBIDDEN,
                "You can only review rentals you have made"
            );
        }

        // Check if rental is completed
        if (rental.status !== 'completed') {
            throw new ApiError(
                httpStatusCodes.BAD_REQUEST,
                "You can only review completed rentals"
            );
        }

        // Check if review already exists
        const existingReview = await ReviewModel.findByRentalId(reviewData.rental_id);
        if (existingReview) {
            throw new ApiError(
                httpStatusCodes.BAD_REQUEST,
                "You have already reviewed this rental"
            );
        }

        return await ReviewModel.create({
            ...reviewData,
            rental_id: rental.id
        });
    },

    async getProductReviews(productId, query) {
        return await ReviewModel.findByProductId(productId, query);
    },

    async getOwnerReviews(ownerId, query) {
        return await ReviewModel.findByOwnerId(ownerId, query);
    },

    async getRentalReview(rentalId) {
        return await ReviewModel.findByRentalId(rentalId);
    }
};

export default ReviewService; 