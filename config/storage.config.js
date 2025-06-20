import dotenv from 'dotenv';
dotenv.config();

const storageConfig = {
    avatarBucketName: process.env.AVATAR_BUCKET_NAME || 'avatars',
    idVerificationBucketName: process.env.ID_VERIFICATION_BUCKET_NAME || 'id-verification',
    chatFilesBucketName: process.env.CHAT_FILES_BUCKET_NAME || 'chat-files'
};

export default storageConfig; 