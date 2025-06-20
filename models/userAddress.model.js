import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const UserAddressModel = {
    async findAllByUserId(userId) {
        const { data, error } = await supabase
            .from('user_addresses')
            .select(`
                *,
                province:provinces (id, name_th)
            `)
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching user addresses:', error);
            throw error;
        }
        return data;
    },

    async findByIdAndUserId(addressId, userId) {
        const { data, error } = await supabase
            .from('user_addresses')
            .select(`
                *,
                province:provinces (id, name_th)
            `)
            .eq('id', addressId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                throw new ApiError(httpStatusCodes.NOT_FOUND, "Address not found.");
            }
            console.error('Error fetching address by id:', error);
            throw error;
        }
        return data;
    },

    async create(userId, addressData) {
        if (addressData.is_default) {
            // Set other addresses of this user to not be default
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .insert({ user_id: userId, ...addressData })
            .select(`*, province:provinces (id, name_th)`)
            .single();

        if (error) {
            console.error('Error creating address:', error);
            throw error;
        }
        return data;
    },

    async update(addressId, userId, addressData) {
        // Fetch current address to check ownership
        const currentAddress = await this.findByIdAndUserId(addressId, userId);
        if (!currentAddress) { // findByIdAndUserId already throws 404 if not found
            return null; // Should not happen if findByIdAndUserId is called first
        }

        if (addressData.is_default === true && !currentAddress.is_default) {
            // Set other addresses of this user to not be default
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId)
                .neq('id', addressId); // Exclude current address
        }

        // Prevent user_id from being updated
        const { user_id, ...safeAddressData } = addressData;

        const { data, error } = await supabase
            .from('user_addresses')
            .update(safeAddressData)
            .eq('id', addressId)
            .eq('user_id', userId) // Double check ownership
            .select(`*, province:provinces (id, name_th)`)
            .single();

        if (error) {
            console.error('Error updating address:', error);
            throw error;
        }
        return data;
    },

    async delete(addressId, userId) {
        const { error, count } = await supabase
            .from('user_addresses')
            .delete({ count: 'exact' })
            .eq('id', addressId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
        if (count === 0) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Address not found or you do not have permission to delete it.");
        }
        return { message: "Address deleted successfully." };
    }
};

export default UserAddressModel; 