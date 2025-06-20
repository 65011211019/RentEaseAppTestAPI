import UserAddressModel from '../models/userAddress.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const UserAddressController = {
    // Get all addresses for the current user
    getAllAddresses: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const addresses = await UserAddressModel.findAllByUserId(userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, addresses, "Addresses retrieved successfully.")
        );
    }),

    // Get a specific address
    getAddress: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const address = await UserAddressModel.findByIdAndUserId(addressId, userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, address, "Address retrieved successfully.")
        );
    }),

    // Create a new address
    createAddress: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const addressData = req.body;
        const newAddress = await UserAddressModel.create(userId, addressData);
        res.status(httpStatusCodes.CREATED).json(
            new ApiResponse(httpStatusCodes.CREATED, newAddress, "Address created successfully.")
        );
    }),

    // Update an existing address
    updateAddress: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const addressData = req.body;
        const updatedAddress = await UserAddressModel.update(addressId, userId, addressData);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, updatedAddress, "Address updated successfully.")
        );
    }),

    // Delete an address
    deleteAddress: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const result = await UserAddressModel.delete(addressId, userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, "Address deleted successfully.")
        );
    })
};

export default UserAddressController; 