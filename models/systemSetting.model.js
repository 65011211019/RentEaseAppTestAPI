import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const SystemSettingModel = {
    async getSetting(key, defaultValue = null) {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('setting_key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                // If setting doesn't exist, return default value
                return { setting_value: defaultValue };
            }
            console.error('Error fetching system setting:', error);
            throw error;
        }

        return data;
    },

    async setSetting(key, value, description = null) {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                setting_key: key,
                setting_value: value,
                description: description,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating system setting:', error);
            throw error;
        }

        return data;
    },

    async getAllSettings() {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .order('setting_key');

        if (error) {
            console.error('Error fetching all system settings:', error);
            throw error;
        }

        return data;
    }
};

export default SystemSettingModel; 