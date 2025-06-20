import ChatConversationModel from '../models/chat_conversation.model.js';
import ChatMessageModel from '../models/chat_message.model.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import { io } from '../server.js';
import NotificationService from './notification.service.js';

const ChatService = {
    async getConversations(userId, query) {
        return await ChatConversationModel.getUserConversations(userId, query);
    },

    async getConversation(userId, conversationId) {
        return await ChatConversationModel.findByIdOrUid(conversationId, userId);
    },

    async getOrCreateConversation(userId, otherUserId, { relatedProductId, relatedRentalId } = {}) {
        // Check if conversation already exists
        const existingConversation = await ChatConversationModel.findByUserAndParticipants(
            userId,
            otherUserId,
            relatedProductId,
            relatedRentalId
        );

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        return await ChatConversationModel.create({
            participant1_id: Math.min(userId, otherUserId),
            participant2_id: Math.max(userId, otherUserId),
            related_product_id: relatedProductId,
            related_rental_id: relatedRentalId
        });
    },

    async getMessages(userId, conversationId, query) {
        // Verify user has access to conversation
        const conversation = await ChatConversationModel.findByIdOrUid(conversationId, userId);
        if (!conversation) {
            throw new ApiError(
                httpStatusCodes.NOT_FOUND,
                "Conversation not found"
            );
        }

        return await ChatMessageModel.findByConversationId(conversationId, query);
    },

    async sendMessage(userId, messageData) {
        // ป้องกันแชทกับตัวเอง (เช็คก่อนทุกกรณี)
        if (messageData.receiver_id && messageData.receiver_id === userId) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "You cannot chat with yourself.");
        }
        let conversation;

        // If conversation_id is provided, verify access
        if (messageData.conversation_id) {
            conversation = await ChatConversationModel.findByIdOrUid(
                messageData.conversation_id,
                userId
            );
            if (!conversation) {
                throw new ApiError(
                    httpStatusCodes.NOT_FOUND,
                    "Conversation not found"
                );
            }
        } else if (messageData.receiver_id) {
            // Create or get existing conversation
            conversation = await this.getOrCreateConversation(
                userId,
                messageData.receiver_id,
                {
                    relatedProductId: messageData.related_product_id,
                    relatedRentalId: messageData.related_rental_id
                }
            );
        } else {
            throw new ApiError(
                httpStatusCodes.BAD_REQUEST,
                "Either conversation_id or receiver_id must be provided"
            );
        }

        // Create message
        const messagePayload = {
            conversation_id: conversation.id,
            sender_id: userId,
            message_type: messageData.message_type,
            message_content: messageData.message_content
        };
        if (messageData.attachment_url) messagePayload.attachment_url = messageData.attachment_url;
        if (messageData.attachment_metadata) messagePayload.attachment_metadata = messageData.attachment_metadata;
        const message = await ChatMessageModel.create(messagePayload);

        // หา recipientId (อีกฝั่ง)
        const recipientId = (conversation.participant1_id === userId)
            ? conversation.participant2_id
            : conversation.participant1_id;

        // Update conversation with last message
        await ChatConversationModel.updateLastMessage(
            conversation.id,
            message.id,
            message.sent_at,
            message.sender_id,
            recipientId
        );

        // --- Realtime: emit event ไปยังห้องแชท ---
        console.log('Emit new_message to room:', `conversation_${conversation.id}`, message);
        io.to(`conversation_${conversation.id}`).emit('new_message', message);

        // --- Realtime: แจ้งให้ user ทั้งสองฝั่ง refresh รายการห้องแชท ---
        console.log('Emit refresh_conversations to user:', userId);
        io.to(`user_${userId}`).emit('refresh_conversations');
        const otherUserId = (conversation.participant1_id === userId) ? conversation.participant2_id : conversation.participant1_id;
        console.log('Emit refresh_conversations to user:', otherUserId);
        io.to(`user_${otherUserId}`).emit('refresh_conversations');

        // --- Notification: แจ้งเตือน recipient ว่ามีข้อความใหม่ ---
        if (recipientId) {
            await NotificationService.createNotification({
                user_id: recipientId,
                type: 'new_message',
                title: 'คุณมีข้อความใหม่',
                message: messageData.message_content || 'คุณได้รับข้อความใหม่',
                link_url: `/chat/${conversation.id}`,
                related_entity_type: 'chat_conversation',
                related_entity_id: conversation.id,
                related_entity_uid: conversation.conversation_uid
            });
        }

        return message;
    },

    async markConversationAsRead(userId, conversationId) {
        // Verify user has access to conversation
        const conversation = await ChatConversationModel.findByIdOrUid(conversationId, userId);
        if (!conversation) {
            throw new ApiError(
                httpStatusCodes.NOT_FOUND,
                "Conversation not found"
            );
        }

        return await ChatConversationModel.markAsRead(conversationId, userId);
    }
};

export default ChatService; 