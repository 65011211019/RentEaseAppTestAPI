import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import serverConfig from '../config/server.config.js';

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR;
        const message = error.message || "Something went wrong (Unhandled)";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(serverConfig.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    };

    console.error("ERROR: ", response);

    return res.status(error.statusCode).json(response);
};

export default errorHandler; 