import IdVerificationService from '../services/idVerification.service.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import { idVerificationSchema, validateIdVerificationFiles } from '../DTOs/idVerification.dto.js';

const IdVerificationController = {
    async submitVerification(req, res, next) {
        try {
            const userId = req.user.id;

            // Validate request body
            const { error: validationError } = idVerificationSchema.validate(req.body);
            if (validationError) {
                throw new ApiError(
                    httpStatusCodes.BAD_REQUEST,
                    validationError.details[0].message
                );
            }

            const verificationData = {
                id_document_type: req.body.id_document_type,
                id_document_number: req.body.id_document_number
            };

            // Validate files
            const fileErrors = validateIdVerificationFiles(req.files);
            if (fileErrors.length > 0) {
                throw new ApiError(
                    httpStatusCodes.BAD_REQUEST,
                    fileErrors.join(', ')
                );
            }

            const files = {
                id_document: req.files.id_document[0],
                id_document_back: req.files.id_document_back[0],
                id_selfie: req.files.id_selfie[0]
            };

            const result = await IdVerificationService.submitVerification(userId, verificationData, files);
            res.status(httpStatusCodes.CREATED).json({
                success: true,
                message: 'ID verification documents submitted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getVerificationStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await IdVerificationService.getVerificationStatus(userId);

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async updateVerificationStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { status, notes } = req.body;

            const result = await IdVerificationService.updateVerificationStatus(
                userId,
                status,
                notes
            );

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getPendingVerifications(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await IdVerificationService.getPendingVerifications({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            });

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};

export default IdVerificationController; 