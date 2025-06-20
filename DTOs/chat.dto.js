import Joi from 'joi';

// ENUM values from DB (chat_message_type_enum)
// 'system_event' and 'rental_offer' might be system-generated, not directly by user.
const USER_CHAT_MESSAGE_TYPES = ['text', 'image', 'file'];

export const sendMessageSchema = Joi.object({
    // Either receiver_id (to start/find a conversation) or conversation_id (for existing one)
    receiver_id: Joi.number().integer().positive().optional(),
    conversation_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().guid({ version: 'uuidv4' })).optional(),
    message_content: Joi.string().allow('').max(2000).optional(),
    message_type: Joi.string().valid(...USER_CHAT_MESSAGE_TYPES).default('text'),
    // attachment_url and attachment_metadata will be handled by file upload service if type is image/file
    related_product_id: Joi.number().integer().positive().optional(),
    related_rental_id: Joi.number().integer().positive().optional()
}).xor('receiver_id', 'conversation_id') // Require one of them but not both
  .when(Joi.object({ message_type: Joi.valid('image', 'file') }).unknown(), {
    // For image/file, message_content is not required, but attachment handling is needed.
    // This DTO focuses on the text part of the request. File will be in req.file(s).
  });

export const getMessagesQuerySchema = Joi.object({
    before_message_id: Joi.number().integer().positive().optional(), // For pagination (load older messages)
    limit: Joi.number().integer().min(1).max(50).default(20)
});

export const getConversationsQuerySchema = Joi.object({
    q: Joi.string().optional().allow(null, ''), // Search other user's name
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(15)
}); 