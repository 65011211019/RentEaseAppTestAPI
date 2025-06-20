import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const CLAIM_SELECT_QUERY = `
    *,
    rental:rentals(id, rental_uid, product_id, renter_id, owner_id, product:products(title, slug)),
    reported_by:users!claims_reported_by_id_fkey(id, first_name, last_name, email),
    accused:users!claims_accused_id_fkey(id, first_name, last_name, email),
    admin_moderator:users!claims_admin_moderator_id_fkey(id, first_name, last_name, email),
    attachments:claim_attachments(*)
`;

const ClaimModel = {
    async create(claimData) {
        const { data, error } = await supabase
            .from('claims')
            .insert(claimData)
            .select(CLAIM_SELECT_QUERY)
            .single();

        if (error) {
            if (error.code === '23505' && error.message.includes('claims_rental_id_key')) { // Unique constraint on rental_id
                throw new ApiError(httpStatusCodes.CONFLICT, "A claim already exists for this rental.");
            }
            console.error("Error creating claim:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to create claim: ${error.message}`);
        }
        return data;
    },

    async findByIdOrUid(identifier) {
        const isNumericId = /^\d+$/.test(identifier);
        const matchField = isNumericId ? 'id' : 'claim_uid';
        const matchValue = isNumericId ? parseInt(identifier, 10) : identifier;

        const { data, error } = await supabase
            .from('claims')
            .select(CLAIM_SELECT_QUERY)
            .eq(matchField, matchValue)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async update(claimId, updateData) {
        const { data, error } = await supabase
            .from('claims')
            .update(updateData)
            .eq('id', claimId)
            .select(CLAIM_SELECT_QUERY)
            .single();

        if (error) {
            console.error("Error updating claim:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, `Failed to update claim: ${error.message}`);
        }
        return data;
    },

    async findByUser(userId, filters = {}) { // For user's claim history
        const { status, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('claims')
            .select(`
                id, claim_uid, status, created_at, claim_type, rental_id, reported_by_id, accused_id,
                rental:rentals(product:products(title, slug)),
                reported_by_user:users!claims_reported_by_id_fkey(id, first_name, last_name),
                accused_user:users!claims_accused_id_fkey(id, first_name, last_name)
            `, {count: 'exact'})
            .or(`reported_by_id.eq.${userId},accused_id.eq.${userId}`);

        if (status) {
            query = query.eq('status', status);
        }

        query = query.order('created_at', { ascending: false })
                     .range(offset, offset + limit - 1);
        
        const { data, error, count } = await query;
        if (error) throw error;
        
        // Post-process to determine other_party_name
        const claimsWithOtherParty = data.map(claim => {
            let other_party_name = "N/A";
            if (claim.reported_by_id === userId && claim.accused_user) {
                other_party_name = `${claim.accused_user.first_name} ${claim.accused_user.last_name}`;
            } else if (claim.accused_id === userId && claim.reported_by_user) {
                other_party_name = `${claim.reported_by_user.first_name} ${claim.reported_by_user.last_name}`;
            }
            return { ...claim, other_party_name, reported_by_user: undefined, accused_user: undefined };
        });

        return {
            data: claimsWithOtherParty,
            meta: {
                current_page: page,
                per_page: limit,
                total: count,
                last_page: Math.ceil(count / limit)
            }
        };
    }
};

export default ClaimModel; 