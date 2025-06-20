import ChatService from '../services/chat.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ChatController = {
    getConversations: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await ChatService.getConversations(userId, req.query);
        res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, result));
    }),

    getMessages: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { conversation_id_or_uid } = req.params;
        const result = await ChatService.getMessages(userId, conversation_id_or_uid, req.query);
        res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, result));
    }),

    sendMessage: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        console.log('POST /api/chat/messages Request Body:', req.body);
        try {
            const message = await ChatService.sendMessage(userId, req.body);
            res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, message));
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }),

    markConversationAsRead: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { conversation_id_or_uid } = req.params;
        const result = await ChatService.markConversationAsRead(userId, conversation_id_or_uid);
        res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, result));
    }),

    sendFileMessage: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { conversation_id_or_uid } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(httpStatusCodes.BAD_REQUEST).json({ success: false, message: 'File is required.' });
        }
        // อัปโหลดไฟล์ไป storage
        const FileService = (await import('../services/file.service.js')).default;
        const storageConfig = (await import('../config/storage.config.js')).default;
        const ext = file.originalname.split('.').pop();
        const filePath = `public/${userId}/${Date.now()}_${file.originalname}`;
        const uploadResult = await FileService.uploadFileToSupabaseStorage(
            file,
            storageConfig.chatFilesBucketName,
            filePath
        );
        // ส่ง message พร้อมข้อมูลไฟล์
        const message = await ChatService.sendMessage(userId, {
            conversation_id: conversation_id_or_uid,
            message_type: file.mimetype.startsWith('image/') ? 'image' : 'file',
            message_content: req.body.message_content || '',
            attachment_url: uploadResult.publicUrl,
            attachment_metadata: {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            }
        });
        res.status(httpStatusCodes.OK).json(new ApiResponse(httpStatusCodes.OK, message));
    })
};

export default ChatController; 