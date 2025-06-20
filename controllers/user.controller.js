import UserService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const UserController = {
    register: asyncHandler(async (req, res) => {
        const clientIp = req.ip || req.socket.remoteAddress;
        const { user, accessToken } = await UserService.registerUser(req.body, clientIp);
        res.status(httpStatusCodes.CREATED).json(
            new ApiResponse(
                httpStatusCodes.CREATED, 
                { user, access_token: accessToken },
                "Registration successful. You are now logged in."
            )
        );
    }),

    getMe: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const userProfile = await UserService.getUserProfile(userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { user: userProfile })
        );
    }),

    updateProfile: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const updatedUser = await UserService.updateUserProfile(userId, req.body);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { user: updatedUser }, "Profile updated successfully.")
        );
    }),

    updateAvatar: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        if (!req.file) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "No avatar file uploaded.");
        }
        const result = await UserService.updateUserAvatar(userId, req.file);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, "Avatar updated successfully.")
        );
    }),

    changePassword: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;
        const result = await UserService.changeUserPassword(userId, current_password, new_password);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, result.message)
        );
    }),

    // New Wishlist Handlers
    addProductToWishlist: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { productId } = req.body;
        if (!productId) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "productId is required in the body.");
        }
        const result = await UserService.addProductToWishlist(userId, productId);
        res.status(httpStatusCodes.CREATED).json(
            new ApiResponse(httpStatusCodes.CREATED, result, result.message)
        );
    }),

    removeProductFromWishlist: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { productId } = req.params;
        const result = await UserService.removeProductFromWishlist(userId, productId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, result.message)
        );
    }),

    getProductWishlistStatus: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { productId } = req.params;
        const status = await UserService.getProductWishlistStatus(userId, productId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, status)
        );
    }),

    getMyWishlist: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await UserService.getMyWishlist(userId, req.query);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result)
        );
    })
};

export default UserController; 