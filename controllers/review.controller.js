import ProductService from '../services/product.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import validateRequest from '../middleware/validateRequest.js';
import { getProductReviewsQuerySchema } from '../DTOs/product.dto.js';

const ReviewController = {
    getProductReviews: asyncHandler(async (req, res) => {
        const { productId } = req.params;
        const result = await ProductService.getProductReviews(productId, req.query);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result)
        );
    })
};

export default ReviewController; 