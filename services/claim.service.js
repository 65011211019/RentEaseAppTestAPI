import ClaimModel from '../models/claim.model.js';
import ClaimAttachmentModel from '../models/claim_attachment.model.js';
import RentalModel from '../models/rental.model.js';
import FileService from './file.service.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ClaimService = {
    async createClaim(reporterId, claimData, attachmentFiles = []) {
        const { rental_id, claim_type, claim_details, requested_amount } = claimData;

        const rental = await RentalModel.findByIdentifier(rental_id);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found for this claim.");
        }

        // Ensure reporter is the owner of the rental's product
        if (rental.owner_id !== reporterId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "Only the product owner can create a claim for this rental.");
        }

        const newClaimPayload = {
            rental_id: rental.id,
            reported_by_id: reporterId,
            accused_id: rental.renter_id, // Renter is accused by default
            claim_type,
            claim_details,
            requested_amount: requested_amount || null,
            status: 'open' // Initial status
        };
        const newClaim = await ClaimModel.create(newClaimPayload);

        // Upload attachments if any
        if (attachmentFiles && attachmentFiles.length > 0) {
            const bucketName = 'claim-attachments';
            const attachmentsToSave = [];
            for (const file of attachmentFiles) {
                const fileName = `claim-${newClaim.id}-att-${Date.now()}-${file.originalname}`;
                const { publicUrl } = await FileService.uploadFileToSupabaseStorage(file, bucketName, `public/${fileName}`);
                if (publicUrl) {
                    attachmentsToSave.push({
                        claim_id: newClaim.id,
                        uploaded_by_id: reporterId,
                        uploader_role: 'owner', // Assuming owner is creating claim
                        file_url: publicUrl,
                        file_type: file.mimetype,
                    });
                }
            }
            if (attachmentsToSave.length > 0) {
                newClaim.attachments = await ClaimAttachmentModel.bulkCreate(attachmentsToSave);
            }
        }
        
        // Update rental status to 'dispute' if it wasn't already
        if (rental.rental_status !== 'dispute') {
            await RentalModel.update(rental.id, { rental_status: 'dispute' });
            // Log status change in rental_status_history if needed
        }

        // TODO: Send notification to Renter about the new claim
        return newClaim;
    },

    async getClaimDetails(claimIdOrUid, userId) {
        const claim = await ClaimModel.findByIdOrUid(claimIdOrUid);
        if (!claim) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Claim not found.");
        }
        // Ensure user is either reporter, accused, or an admin
        if (claim.reported_by_id !== userId && claim.accused_id !== userId /* && !req.user.is_admin */) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to view this claim.");
        }
        return claim;
    },

    async respondToClaim(claimIdOrUid, responderId, responseData, attachmentFiles = []) { // Responder is usually the Renter
        const { response_details } = responseData;
        const claim = await ClaimModel.findByIdOrUid(claimIdOrUid);
        if (!claim) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Claim not found.");
        }
        if (claim.accused_id !== responderId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to respond to this claim.");
        }
        if (claim.status !== 'open' && claim.status !== 'awaiting_renter_response') { // Or other statuses allowing response
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Cannot respond to claim. Current status: ${claim.status}`);
        }

        const updatePayload = {
            renter_response_details: response_details,
            status: 'awaiting_owner_counter_response' // Or 'negotiating' or 'pending_admin_review'
        };
        
        // Handle attachments for response
        if (attachmentFiles && attachmentFiles.length > 0) {
            const bucketName = 'claim-attachments';
            const attachmentsToSave = [];
            for (const file of attachmentFiles) {
                const fileName = `claim-${claim.id}-resp-${Date.now()}-${file.originalname}`;
                const { publicUrl } = await FileService.uploadFileToSupabaseStorage(file, bucketName, `public/${fileName}`);
                if (publicUrl) {
                    attachmentsToSave.push({
                        claim_id: claim.id,
                        uploaded_by_id: responderId,
                        uploader_role: 'renter',
                        file_url: publicUrl,
                        file_type: file.mimetype,
                    });
                }
            }
            if (attachmentsToSave.length > 0) {
                 await ClaimAttachmentModel.bulkCreate(attachmentsToSave);
            }
        }

        const updatedClaim = await ClaimModel.update(claim.id, updatePayload);
        // TODO: Send notification to Owner about the response
        return updatedClaim;
    },

    async getUserClaims(userId, filters) {
        return ClaimModel.findByUser(userId, filters);
    }

    // Admin claim management methods will be in Admin service
};

export default ClaimService; 