import CategoryService from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import Joi from 'joi';

const categoryQuerySchema = Joi.object({
    featured: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).optional()
});

const CategoryController = {
    getAll: asyncHandler(async (req, res) => {
        const { error, value: queryParams } = categoryQuerySchema.validate(req.query);
        if (error) {
            return res.status(httpStatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid query parameters",
                errors: error.details.map(d => d.message)
            });
        }

        const categories = await CategoryService.getCategories(queryParams);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: categories })
        );
    })
};

export default CategoryController; 