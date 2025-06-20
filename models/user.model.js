import supabase from '../db/supabaseClient.js';

const USER_COLUMNS_TO_SELECT = `
    id, username, email, first_name, last_name, phone_number,
    profile_picture_url, email_verified_at, last_login_at, is_active,
    address_line1, address_line2, city, province_id, postal_code,
    id_verification_status, id_verification_notes, id_document_type,
    id_document_number, id_document_url, id_document_back_url, id_selfie_url,
    created_at, updated_at
`;

const UserModel = {
    async findByEmailOrUsername(emailOrUsername) {
        const term = emailOrUsername.toLowerCase();
        const { data, error } = await supabase
            .from('users')
            .select(`*, password_hash`)
            .or(`email.eq.${term},username.eq.${term}`)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error("Error finding user by email/username:", error);
            throw error;
        }
        return data;
    },

    async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select(USER_COLUMNS_TO_SELECT)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async findByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, first_name')
            .eq('email', email.toLowerCase())
            .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async findByUsername(username) {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', username.toLowerCase())
            .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async create(userData) {
        const { username, email, password_hash, first_name, last_name, phone_number, registration_ip } = userData;
        const { data, error } = await supabase
            .from('users')
            .insert({
                username,
                email: email.toLowerCase(),
                password_hash,
                first_name,
                last_name,
                phone_number,
                registration_ip,
                is_active: true,
                id_verification_status: 'not_submitted',
            })
            .select(USER_COLUMNS_TO_SELECT)
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updateData) {
        const allowedFields = [
            'first_name', 'last_name', 'phone_number', 'profile_picture_url', 
            'password_hash', 'address_line1', 'address_line2', 'city', 
            'province_id', 'postal_code', 'id_verification_status', 
            'id_verification_notes', 'id_document_type', 'id_document_number',
            'id_document_url', 'id_document_back_url', 'id_selfie_url',
            'id_verified_at', 'updated_at'
        ];

        const dataToUpdate = {};
        for (const key of allowedFields) {
            if (updateData.hasOwnProperty(key)) {
                dataToUpdate[key] = updateData[key];
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return this.findById(id);
        }

        const { data, error } = await supabase
            .from('users')
            .update(dataToUpdate)
            .eq('id', id)
            .select(USER_COLUMNS_TO_SELECT)
            .single();

        if (error) {
            console.error("Error updating user:", error);
            throw error;
        }
        return data;
    },

    async updateLastLogin(id) {
        const { error } = await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', id);
        if (error) console.error("Error updating last login:", error);
    },

    async checkAdmin(userId) {
        const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    },

    async updateIdVerification(userId, verificationData) {
        // Fields: id_document_type, id_document_number, id_document_url,
        // id_document_back_url, id_selfie_url, id_verification_status, id_verification_notes
        const { data, error } = await supabase
            .from('users')
            .update(verificationData)
            .eq('id', userId)
            .select(`id, id_verification_status, id_verification_notes, id_document_type, id_document_number, id_document_url, id_document_back_url, id_selfie_url`)
            .single();

        if (error) {
            console.error("Error updating ID verification data:", error);
            throw error;
        }
        return data;
    },

    async storeOtp(userId, otp) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes

        const { error } = await supabase
            .from('password_reset_otps')
            .upsert({
                user_id: userId,
                otp: otp,
                expires_at: expiresAt.toISOString()
            });

        if (error) throw error;
    },

    async verifyOtp(userId, otp) {
        const { data, error } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('user_id', userId)
            .eq('otp', otp)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    async clearOtp(userId) {
        const { error } = await supabase
            .from('password_reset_otps')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },

    async updatePassword(userId, hashedPassword) {
        const { error } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', userId);

        if (error) throw error;
    }
};

export default UserModel; 