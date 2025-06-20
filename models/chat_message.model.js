import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ChatMessageModel = {
    async create(messageData) {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert(messageData)
            .select(`
                *,
                sender:users(id, first_name, profile_picture_url)
            `)
            .single();
        
        if (error) {
            console.error("Error creating chat message:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to send message.");
        }
        return data;
    },

    async findByConversationId(conversationId, { before_message_id, limit = 20 }) {
        let query = supabase
            .from('chat_messages')
            .select(`
                *,
                sender:users(id, first_name, profile_picture_url)
            `)
            .eq('conversation_id', conversationId);

        if (before_message_id) {
            // Fetch messages older than the given message_id (cursor-based pagination)
            // This requires sent_at of the before_message_id, or assuming IDs are sequential (which is okay for BIGSERIAL)
            query = query.lt('id', before_message_id);
        }
        
        query = query.order('sent_at', { ascending: false }) // Get newest first for limit, then reverse in service
                     .limit(limit);

        const { data, error } = await query;

        if (error) throw error;
        return data.reverse(); // Reverse to show oldest of the batch first
    }
};

export default ChatMessageModel; 