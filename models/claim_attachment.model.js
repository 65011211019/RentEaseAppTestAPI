import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ClaimAttachmentModel = {
    async bulkCreate(attachmentsData) { // attachmentsData is an array of objects
        if (!attachmentsData || attachmentsData.length === 0) {
            return [];
        }
        const { data, error } = await supabase
            .from('claim_attachments')
            .insert(attachmentsData)
            .select();

        if (error) {
            console.error("Error bulk creating claim attachments:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to save claim attachments.");
        }
        return data;
    }
};

export default ClaimAttachmentModel; 