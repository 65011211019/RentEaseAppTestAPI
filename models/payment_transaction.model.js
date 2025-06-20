import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const PaymentTransactionModel = {
    async create(transactionData) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .insert(transactionData)
            .select()
            .single();

        if (error) {
            console.error('Error creating payment transaction:', error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to create payment transaction: ${error.message}`);
        }
        return data;
    },

    async findByUid(transactionUid) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('transaction_uid', transactionUid)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    },

    async updateByUid(transactionUid, updateData) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .update(updateData)
            .eq('transaction_uid', transactionUid)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment transaction:', error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to update payment transaction: ${error.message}`);
        }
        return data;
    },

    async findByRentalId(rentalId) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('rental_id', rentalId)
            .order('transaction_time', { ascending: false });

        if (error) {
            console.error('Error fetching payment transactions by rental ID:', error);
            throw error;
        }
        return data;
    }
};

export default PaymentTransactionModel; 