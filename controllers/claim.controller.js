import ClaimService from '../services/claim.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
// DTOs will be used in routes

const ClaimController = {
    createClaim: asyncHandler(async (req, res) => {
        const reporterId = req.user.id; // Usually owner
        // req.validatedData from createClaimSchema
        const attachmentFiles = req.files ? req.files['attachments[]'] : [];

        const newClaim = await ClaimService.createClaim(reporterId, req.validatedData, attachmentFiles);
        res.status(httpStatusCodes.CREATED).json(
            new ApiResponse(httpStatusCodes.CREATED, { data: newClaim }, "Claim created successfully.")
        );
    }),

    getClaimDetails: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { claim_id_or_uid } = req.params;
        const claim = await ClaimService.getClaimDetails(claim_id_or_uid, userId);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: claim })
        );
    }),

    respondToClaim: asyncHandler(async (req, res) => { // Renter responds
        const responderId = req.user.id;
        const { claim_id_or_uid } = req.params;
        // req.validatedData from respondToClaimSchema
        const attachmentFiles = req.files ? req.files['attachments[]'] : [];
        
        const updatedClaim = await ClaimService.respondToClaim(claim_id_or_uid, responderId, req.validatedData, attachmentFiles);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: updatedClaim }, "Response submitted successfully.")
        );
    }),

    getMyClaims: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const filters = req.query; // Or req.validatedData if using DTO for query params
        const claims = await ClaimService.getUserClaims(userId, filters);
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, claims)
        );
    })

    // Admin claim management will be in AdminClaimController
};

export default ClaimController; 