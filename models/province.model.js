import supabase from '../db/supabaseClient.js';

const ProvinceModel = {
    async findAll() {
        const { data, error } = await supabase
            .from('provinces')
            .select('id, name_th, name_en, region_id')
            .order('name_th', { ascending: true });

        if (error) {
            console.error("Error fetching provinces:", error);
            throw error;
        }
        return data;
    },

    async findById(id) {
        const { data, error } = await supabase
            .from('provinces')
            .select('id, name_th, name_en, region_id')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
};

export default ProvinceModel; 