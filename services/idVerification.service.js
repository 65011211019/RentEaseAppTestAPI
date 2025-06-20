import UserModel from '../models/user.model.js';
import FileService from './file.service.js';
import storageConfig from '../config/storage.config.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ID_VERIFICATION_STATUS = {
    NOT_SUBMITTED: 'not_submitted',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

const IdVerificationService = {
    async submitVerification(userId, verificationData, files) {
        const { id_document_type, id_document_number } = verificationData;
        const { id_document, id_document_back, id_selfie } = files;

        // Check if user already has a pending verification
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found");
        }

        if (user.id_verification_status === ID_VERIFICATION_STATUS.PENDING) {
            throw new ApiError(
                httpStatusCodes.BAD_REQUEST,
                "You already have a pending ID verification request"
            );
        }

        try {
            // Upload files to Supabase Storage
            const [idDocumentResult, idDocumentBackResult, idSelfieResult] = await Promise.all([
                FileService.uploadFileToSupabaseStorage(
                    id_document,
                    storageConfig.idVerificationBucketName,
                    `public/${userId}/id_document.${id_document.originalname.split('.').pop()}`
                ),
                FileService.uploadFileToSupabaseStorage(
                    id_document_back,
                    storageConfig.idVerificationBucketName,
                    `public/${userId}/id_document_back.${id_document_back.originalname.split('.').pop()}`
                ),
                FileService.uploadFileToSupabaseStorage(
                    id_selfie,
                    storageConfig.idVerificationBucketName,
                    `public/${userId}/id_selfie.${id_selfie.originalname.split('.').pop()}`
                )
            ]);

            // Update user with verification data and document URLs
            const updateData = {
                id_verification_status: ID_VERIFICATION_STATUS.PENDING,
                id_verification_notes: null,
                id_document_type,
                id_document_number,
                id_document_url: idDocumentResult.publicUrl,
                id_document_back_url: idDocumentBackResult.publicUrl,
                id_selfie_url: idSelfieResult.publicUrl,
                updated_at: new Date().toISOString()
            };

            // Update user in database
            const updatedUser = await UserModel.update(userId, updateData);
            
            if (!updatedUser) {
                // If update fails, try to delete uploaded files
                await Promise.all([
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_document`),
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_document_back`),
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_selfie`)
                ]);
                throw new ApiError(
                    httpStatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to update user verification data in database"
                );
            }

            return updatedUser;
        } catch (error) {
            // If there's an error, try to delete any uploaded files
            try {
                await Promise.all([
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_document`),
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_document_back`),
                    FileService.deleteFileFromSupabaseStorage(storageConfig.idVerificationBucketName, `public/${userId}/id_selfie`)
                ]);
            } catch (deleteError) {
                console.error('Error cleaning up files after failed upload:', deleteError);
            }
            throw error;
        }
    },

    async getVerificationStatus(userId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found");
        }

        return {
            status: user.id_verification_status,
            notes: user.id_verification_notes,
            document_type: user.id_document_type,
            document_number: user.id_document_number,
            document_url: user.id_document_url,
            document_back_url: user.id_document_back_url,
            selfie_url: user.id_selfie_url
        };
    },

    async updateVerificationStatus(userId, status, notes) {
        if (!Object.values(ID_VERIFICATION_STATUS).includes(status)) {
            throw new ApiError(
                httpStatusCodes.BAD_REQUEST,
                "Invalid verification status"
            );
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found");
        }

        const updateData = {
            id_verification_status: status,
            id_verification_notes: notes,
            id_verified_at: status === ID_VERIFICATION_STATUS.APPROVED ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        };

        const updatedUser = await UserModel.update(userId, updateData);
        if (!updatedUser) {
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to update verification status"
            );
        }

        return updatedUser;
    },

    async getPendingVerifications({ page = 1, limit = 10 }) {
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error, count } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                id_verification_status,
                id_verification_notes,
                id_document_type,
                id_document_number,
                id_document_url,
                id_document_back_url,
                id_selfie_url,
                created_at
            `, { count: 'exact' })
            .eq('id_verification_status', ID_VERIFICATION_STATUS.PENDING)
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error("Error fetching pending verifications:", error);
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to fetch pending verifications"
            );
        }

        return {
            verifications: data,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }
};

export default IdVerificationService; 