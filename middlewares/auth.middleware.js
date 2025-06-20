import { verifyToken } from '../utils/jwt.utils.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import UserModel from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(httpStatusCodes.UNAUTHORIZED, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new ApiError(httpStatusCodes.UNAUTHORIZED, "No token provided");
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid token");
        }

        const user = await UserModel.findById(decoded.id);
        if (!user) {
            throw new ApiError(httpStatusCodes.UNAUTHORIZED, "User not found");
        }

        if (!user.is_active) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "Account is deactivated");
        }

        // Attach user to request object
        req.user = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            is_admin: decoded.is_admin
        };

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            next(new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid token"));
        }
    }
}; 