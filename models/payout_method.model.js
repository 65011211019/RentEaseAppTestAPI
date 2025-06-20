import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const PayoutMethodModel = {
    async findAllByOwnerId(ownerId) {
        const { data, error } = await supabase
            .from('payout_methods')
            .select('*')
            .eq('owner_id', ownerId)
            .order('is_primary', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching payout methods:', error);
            throw error;
        }
        return data;
    },

    async findByIdAndOwnerId(id, ownerId) {
        const { data, error } = await supabase
            .from('payout_methods')
            .select('*')
            .eq('id', id)
            .eq('owner_id', ownerId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                throw new ApiError(httpStatusCodes.NOT_FOUND, "Payout method not found or does not belong to you.");
            }
            console.error('Error fetching payout method by id:', error);
            throw error;
        }
        return data;
    },

    async create(ownerId, methodData) {
        if (methodData.is_primary) {
            // Set other methods of this owner to not be primary
            await supabase
                .from('payout_methods')
                .update({ is_primary: false })
                .eq('owner_id', ownerId);
        }

        const { data, error } = await supabase
            .from('payout_methods')
            .insert({ owner_id: ownerId, ...methodData })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating payout method:', error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to create payout method: ${error.message}`);
        }
        return data;
    },

    async update(id, ownerId, methodData) {
        // Ensure ownership by fetching first (or trust RLS if configured)
        const existingMethod = await this.findByIdAndOwnerId(id, ownerId);
        if (!existingMethod) {
             // findByIdAndOwnerId throws 404, so this check is mostly for type safety
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Payout method not found.");
        }

        if (methodData.is_primary === true && !existingMethod.is_primary) {
            // Set other methods of this owner to not be primary
            await supabase
                .from('payout_methods')
                .update({ is_primary: false })
                .eq('owner_id', ownerId)
                .neq('id', id);
        }

        // Prevent owner_id from being updated
        const { owner_id, ...safeUpdateData } = methodData;

        const { data, error } = await supabase
            .from('payout_methods')
            .update(safeUpdateData)
            .eq('id', id)
            .eq('owner_id', ownerId) // Double check ownership
            .select('*')
            .single();

        if (error) {
            console.error('Error updating payout method:', error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to update payout method: ${error.message}`);
        }
        return data;
    },

    async delete(id, ownerId) {
        const { error, count } = await supabase
            .from('payout_methods')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('owner_id', ownerId);

        if (error) {
            console.error('Error deleting payout method:', error);
            throw error;
        }
        if (count === 0) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Payout method not found or you do not have permission to delete it.");
        }
        return { message: "Payout method deleted successfully." };
    }
};

export default PayoutMethodModel; 