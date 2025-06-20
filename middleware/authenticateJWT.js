// JWT authentication middleware 
import { verifyToken } from '../utils/jwt.utils.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        const decoded = verifyToken(token);

        if (decoded && decoded.id) {
            req.user = decoded;
            next();
        } else {
            throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid or expired token.");
        }
    } else {
        throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Authorization header with Bearer token is missing.");
    }
};

export default authenticateJWT; 