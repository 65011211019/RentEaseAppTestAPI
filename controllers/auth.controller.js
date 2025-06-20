// Authentication controller 
import AuthService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const AuthController = {
    login: asyncHandler(async (req, res) => {
        const { email_or_username, password } = req.body;
        const result = await AuthService.loginUser(email_or_username, password);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(
                httpStatusCodes.OK, 
                { access_token: result.accessToken, user: result.user, is_admin: result.is_admin }, 
                "Login successful."
            )
        );
    }),

    requestPasswordReset: asyncHandler(async (req, res) => {
        const { email } = req.body;
        const result = await AuthService.requestPasswordReset(email);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, result.message)
        );
    }),

    resetPasswordWithOtp: asyncHandler(async (req, res) => {
        const { email, otp, new_password } = req.body;
        const result = await AuthService.resetPasswordWithOtp(email, otp, new_password);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, result.message)
        );
    }),
};

export default AuthController; 