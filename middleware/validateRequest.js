import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        try {
            // Get the data to validate - create a copy to avoid issues with read-only properties
            const dataToValidate = { ...req[property] };
            
            // Log data being validated
            console.log(`Data to validate for ${property}:`, dataToValidate);

            // Validate the data
            const { error, value } = schema.validate(dataToValidate, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errorMessage = error.details.map(detail => detail.message).join(', ');
                return next(new ApiError(httpStatusCodes.BAD_REQUEST, errorMessage));
            }

            // Store the validated data back in the request - assign to req.validatedData
            // We avoid writing directly to req[property] like req.query or req.body
            req.validatedData = value; 
            
            next();
        } catch (err) {
            // Log the actual error from schema.validate
            console.error(`Error during schema validation for ${property}:`, err);
            next(new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid request data")); // Keep the generic message for client
        }
    };
};

export default validateRequest; 