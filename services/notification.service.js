import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import { emitNotificationToUser } from '../server.js';

const NotificationService = {
    async getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
        return data;
    },
    async markAsRead(userId, notificationIds = []) {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, 'notification_ids is required');
        }
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', notificationIds)
            .eq('user_id', userId);
        if (error) throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
        return { success: true };
    },
    async createNotification({ user_id, type, title, message, link_url, related_entity_type, related_entity_id, related_entity_uid }) {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id,
                type,
                title,
                message,
                link_url,
                related_entity_type,
                related_entity_id,
                related_entity_uid
            })
            .select('*')
            .single();
        if (error) throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
        // emit realtime notification
        emitNotificationToUser(user_id, data);
        return data;
    }
};

export default NotificationService; 