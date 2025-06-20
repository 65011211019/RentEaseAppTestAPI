import supabase from '../db/supabaseClient.js';

const CategoryModel = {
    async findAll(filters = {}) {
        let query = supabase
            .from('categories')
            .select('id, name, name_en, slug, description, icon_url, image_url, sort_order, parent_id')
            .eq('is_active', true);

        if (filters.featured) {
            query = query.eq('is_featured', true);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        query = query.order('sort_order', { ascending: true })
                     .order('name', { ascending: true }); // Secondary sort by name

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching categories:", error);
            throw error;
        }
        return data;
    },

    async findById(id) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();
        if (error) throw error;
        return data;
    },

    async findBySlug(slug) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        if (error) throw error;
        return data;
    }
};

export default CategoryModel; 