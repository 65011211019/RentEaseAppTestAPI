import express from 'express';
import UserController from '../controllers/user.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import validateRequest from '../middleware/validateRequest.js';
import { uploadSingleFile, uploadMultipleFields } from '../middleware/fileUpload.js';
import { registerSchema, updateProfileSchema, changePasswordSchema } from '../DTOs/user.dto.js';
import { paginationSchema } from '../DTOs/common.dto.js';
import Joi from 'joi';
import IdVerificationController from '../controllers/idVerification.controller.js';
import { idVerificationSchema } from '../DTOs/idVerification.dto.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), UserController.register);

// Protected routes below
router.get('/me', authenticateJWT, UserController.getMe);
router.put('/me/profile', authenticateJWT, validateRequest(updateProfileSchema), UserController.updateProfile);
router.post('/me/avatar', authenticateJWT, uploadSingleFile('avatar'), UserController.updateAvatar);
router.put('/me/password', authenticateJWT, validateRequest(changePasswordSchema), UserController.changePassword);

// ID Verification routes
router.get(
    '/me/id-verification',
    authenticateJWT,
    IdVerificationController.getVerificationStatus
);

router.post(
    '/me/id-verification',
    authenticateJWT,
    uploadMultipleFields([
        { name: 'id_document', maxCount: 1 },
        { name: 'id_document_back', maxCount: 1 },
        { name: 'id_selfie', maxCount: 1 }
    ]),
    (req, res, next) => {
        if (!req.files || !req.files.id_document || !req.files.id_document_back || !req.files.id_selfie) {
            return res.status(400).json({
                success: false,
                message: 'Missing required files. Please upload all required documents.'
            });
        }
        next();
    },
    IdVerificationController.submitVerification
);

// Wishlist routes (Protected)
router.post(
    '/me/wishlist',
    authenticateJWT,
    validateRequest(Joi.object({ productId: Joi.number().integer().positive().required() }), 'body'),
    UserController.addProductToWishlist
);

router.delete(
    '/me/wishlist/:productId',
    authenticateJWT,
    validateRequest(Joi.object({ productId: Joi.number().integer().positive().required() }), 'params'),
    UserController.removeProductFromWishlist
);

router.get(
    '/me/wishlist/:productId/status',
    authenticateJWT,
    validateRequest(Joi.object({ productId: Joi.number().integer().positive().required() }), 'params'),
    UserController.getProductWishlistStatus
);

router.get(
    '/me/wishlist',
    authenticateJWT,
    validateRequest(paginationSchema, 'query'),
    UserController.getMyWishlist
);

export default router;