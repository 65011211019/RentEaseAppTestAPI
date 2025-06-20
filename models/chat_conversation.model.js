import supabase from '../db/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ChatConversationModel = {
    async findByIdOrUid(identifier, userId) {
        const isNumericId = /^\d+$/.test(identifier);
        const matchField = isNumericId ? 'id' : 'conversation_uid';
        const matchValue = isNumericId ? parseInt(identifier, 10) : identifier;

        const { data, error } = await supabase
            .from('chat_conversations')
            .select(`
                *,
                participant1:users!fk_chat_conversations_p1(id, first_name, profile_picture_url),
                participant2:users!fk_chat_conversations_p2(id, first_name, profile_picture_url),
                last_message:chat_messages!fk_chat_conversations_last_message(message_content, message_type, sent_at, sender_id),
                related_product:products(id, title, slug)
            `)
            .eq(matchField, matchValue)
            .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`) // Ensure user is part of convo
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') throw new ApiError(httpStatusCodes.NOT_FOUND, "Conversation not found.");
            throw error;
        }
        return data;
    },

    async findByUserAndParticipants(userId1, userId2, relatedProductId = null, relatedRentalId = null) {
        // Ensure participant IDs are ordered consistently for the unique constraint
        const p1 = Math.min(userId1, userId2);
        const p2 = Math.max(userId1, userId2);

        let query = supabase
            .from('chat_conversations')
            .select(`
                *,
                participant1:users!fk_chat_conversations_p1(id, first_name, profile_picture_url),
                participant2:users!fk_chat_conversations_p2(id, first_name, profile_picture_url),
                last_message:chat_messages!fk_chat_conversations_last_message(message_content, message_type, sent_at, sender_id),
                related_product:products(id, title, slug)
            `)
            .eq('participant1_id', p1)
            .eq('participant2_id', p2);

        if (relatedProductId !== null) {
            query = query.eq('related_product_id', relatedProductId);
        } else {
            query = query.is('related_product_id', null);
        }
        // Similarly for related_rental_id if you add that to the unique constraint and search criteria
        if (relatedRentalId !== null) {
            query = query.eq('related_rental_id', relatedRentalId);
        } else {
            query = query.is('related_rental_id', null);
        }
        
        const { data, error } = await query.maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async create(data) {
        // Ensure participant IDs are ordered consistently
        const p1 = Math.min(data.participant1_id, data.participant2_id);
        const p2 = Math.max(data.participant1_id, data.participant2_id);
        const insertData = { ...data, participant1_id: p1, participant2_id: p2 };

        const { data: newConversation, error } = await supabase
            .from('chat_conversations')
            .insert(insertData)
            .select(`
                *,
                participant1:users!fk_chat_conversations_p1(id, first_name, profile_picture_url),
                participant2:users!fk_chat_conversations_p2(id, first_name, profile_picture_url),
                last_message:chat_messages!fk_chat_conversations_last_message(message_content, message_type, sent_at, sender_id),
                related_product:products(id, title, slug)
            `)
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                // This means conversation already exists, try to fetch it
                return this.findByUserAndParticipants(
                    data.participant1_id,
                    data.participant2_id,
                    data.related_product_id,
                    data.related_rental_id
                );
            }
            console.error("Error creating chat conversation:", error);
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to create conversation.");
        }
        return newConversation;
    },

    async updateLastMessage(conversationId, lastMessageId, lastMessageAt, senderId, recipientId) {
        // Determine which unread count to increment
        const conversation = await this.findByIdOrUid(conversationId, senderId); // Fetch to know p1 & p2
        if (!conversation) return null;

        let updatePayload = {
            last_message_id: lastMessageId,
            last_message_at: lastMessageAt,
        };

        if (conversation.participant1_id === recipientId) {
            updatePayload.p1_unread_count = (conversation.p1_unread_count || 0) + 1;
        } else if (conversation.participant2_id === recipientId) {
            updatePayload.p2_unread_count = (conversation.p2_unread_count || 0) + 1;
        }
        
        const { data, error } = await supabase
            .from('chat_conversations')
            .update(updatePayload)
            .eq('id', conversationId) // Use actual ID for update
            .select('id, p1_unread_count, p2_unread_count')
            .single();

        if (error) throw error;
        return data;
    },

    async markAsRead(conversationId, userId) {
        const conversation = await this.findByIdOrUid(conversationId, userId);
        if (!conversation) return null;

        let updatePayload = {};
        if (conversation.participant1_id === userId) {
            updatePayload.p1_unread_count = 0;
        } else if (conversation.participant2_id === userId) {
            updatePayload.p2_unread_count = 0;
        }
        
        if (Object.keys(updatePayload).length > 0) {
            const { error } = await supabase
                .from('chat_conversations')
                .update(updatePayload)
                .eq('id', conversationId); // Use actual ID
            if (error) throw error;
        }
        // Also mark messages as read
        const { error: msgError } = await supabase
            .from('chat_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .is('read_at', null);
        
        if (msgError) console.error("Error marking chat messages as read:", msgError);

        return { success: true };
    },

    async getUserConversations(userId, { page = 1, limit = 15, q = '' }) {
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('chat_conversations')
            .select(`
                *,
                participant1:users!fk_chat_conversations_p1(id, first_name, last_name, profile_picture_url),
                participant2:users!fk_chat_conversations_p2(id, first_name, last_name, profile_picture_url),
                last_message:chat_messages!fk_chat_conversations_last_message(message_content, message_type, sent_at, sender_id),
                related_product:products(id, title, slug)
            `, { count: 'exact' })
            .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
            // Filter out archived conversations for the current user
            .or(`participant1_id.eq.${userId},and(p1_archived_at.is.null)`)
            .or(`participant2_id.eq.${userId},and(p2_archived_at.is.null)`);

        if (q) {
            query = query.or(`participant1.first_name.ilike.%${q}%,participant1.last_name.ilike.%${q}%,participant2.first_name.ilike.%${q}%,participant2.last_name.ilike.%${q}%`);
        }
        
        query = query.order('last_message_at', { ascending: false, nullsFirst: false })
                     .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // Post-process to determine other_user and user's unread_count
        const conversations = data.map(convo => {
            let otherUser;
            let unreadCount;
            if (convo.participant1_id === userId) {
                otherUser = convo.participant2;
                unreadCount = convo.p1_unread_count;
            } else {
                otherUser = convo.participant1;
                unreadCount = convo.p2_unread_count;
            }
            return {
                ...convo,
                other_user: otherUser,
                unread_count: unreadCount,
                // Remove participant1 and participant2 to simplify response
                participant1: undefined, 
                participant2: undefined,
            };
        });

        return {
            data: conversations,
            meta: {
                current_page: page,
                per_page: limit,
                total: count,
                last_page: Math.ceil(count / limit)
            }
        };
    }
};

export default ChatConversationModel; 