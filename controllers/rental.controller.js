import RentalService from '../services/rental.service.js';
import PaymentService from '../services/payment.service.js'; // For gateway payments
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import { ApiError } from '../utils/apiError.js';
// DTO for createRental will be used in the route

const RentalController = {
    createRentalRequest: asyncHandler(async (req, res) => {
        const renterId = req.user.id; // User making the request is the renter
        const newRental = await RentalService.createRentalRequest(renterId, req.validatedData);
        res.status(httpStatusCodes.CREATED).json(
            new ApiResponse(httpStatusCodes.CREATED, { data: newRental }, "Rental request submitted successfully.")
        );
    }),

    // --- New Handlers for Day 4 ---
    approveRental: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const updatedRental = await RentalService.approveRentalRequest(rental_id_or_uid, ownerId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Rental approved successfully.")
        );
    }),

    rejectRental: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const { reason } = req.validatedData; // From rejectRentalSchema
        const updatedRental = await RentalService.rejectRentalRequest(rental_id_or_uid, ownerId, reason);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Rental rejected successfully.")
        );
    }),

    uploadPaymentProof: asyncHandler(async (req, res) => {
        const renterId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const paymentDetails = req.validatedData || {}; // DTO for transaction_time, amount_paid
        
        if (!req.file) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Payment proof image file is required.");
        }

        const updatedRental = await RentalService.submitPaymentProof(rental_id_or_uid, renterId, req.file, paymentDetails);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Payment proof submitted successfully.")
        );
    }),

    initiateGatewayPayment: asyncHandler(async (req, res) => {
        const renterId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const { payment_method_type } = req.validatedData; // From initiatePaymentSchema
        const result = await PaymentService.initiateGatewayPayment(rental_id_or_uid, renterId, payment_method_type);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, result, result.message)
        );
    }),

    getRentalPaymentStatus: asyncHandler(async (req, res) => {
        const userId = req.user.id; // Can be renter or owner
        const { rental_id_or_uid } = req.params;
        const statusInfo = await RentalService.checkRentalPaymentStatus(rental_id_or_uid, userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, statusInfo)
        );
    }),

    cancelRentalByRenter: asyncHandler(async (req, res) => {
        const renterId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const { reason } = req.validatedData; // From cancelRentalSchema
        const updatedRental = await RentalService.cancelRentalByUser(rental_id_or_uid, renterId, reason);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Rental cancelled successfully.")
        );
    }),

    getRentalDetails: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const rentalDetails = await RentalService.getRentalDetailsForUser(rental_id_or_uid, userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: rentalDetails })
        );
    }),

    processReturnHandler: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const imageFiles = req.files ? req.files['return_condition_images[]'] : [];
        
        const updatedRental = await RentalService.processReturn(
            rental_id_or_uid, 
            ownerId, 
            req.validatedData, 
            imageFiles
        );
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Return processed successfully.")
        );
    }),

    verifyRentalPayment: asyncHandler(async (req, res) => {
        const ownerId = req.user.id;
        const { rental_id_or_uid } = req.params;
        const { amount_paid } = req.body || {};
        const updatedRental = await RentalService.verifyRentalPaymentByOwner(rental_id_or_uid, ownerId, { amount_paid });
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedRental }, "Payment verified successfully.")
        );
    })
};

export default RentalController; 