import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import storageConfig from '../config/storage.config.js';

const FileService = {
    async uploadFileToSupabaseStorage(fileObject, bucketName, filePathWithExtension) {
        if (!fileObject) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "No file provided for upload.");
        }

        try {
            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(filePathWithExtension, fileObject.buffer, {
                    contentType: fileObject.mimetype,
                    upsert: true,
                });

            if (error) {
                console.error("Supabase storage upload error:", error);
                throw new ApiError(
                    httpStatusCodes.INTERNAL_SERVER_ERROR,
                    `Failed to upload file: ${error.message}`
                );
            }

            // Get public URL for the uploaded file
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(data.path);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                console.warn("Could not get public URL for uploaded file:", data.path);
                throw new ApiError(
                    httpStatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to generate public URL for uploaded file"
                );
            }

            return {
                path: data.path,
                publicUrl: publicUrlData.publicUrl,
                contentType: fileObject.mimetype,
                size: fileObject.size
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error("Unexpected error during file upload:", error);
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred during file upload"
            );
        }
    },

    async deleteFileFromSupabaseStorage(bucketName, filePath) {
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .remove([filePath]);

            if (error) {
                console.error("Supabase storage delete error:", error);
                throw new ApiError(
                    httpStatusCodes.INTERNAL_SERVER_ERROR,
                    `Failed to delete file: ${error.message}`
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error("Unexpected error during file deletion:", error);
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred during file deletion"
            );
        }
    },

    async getFilePublicUrl(bucketName, filePath) {
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            if (error) {
                console.error("Error getting public URL:", error);
                throw new ApiError(
                    httpStatusCodes.INTERNAL_SERVER_ERROR,
                    `Failed to get public URL: ${error.message}`
                );
            }

            return data.publicUrl;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error("Unexpected error getting public URL:", error);
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred while getting public URL"
            );
        }
    }
};

export default FileService; 