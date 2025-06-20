import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import { loginSchema, requestPasswordResetSchema, resetPasswordWithOtpSchema } from '../DTOs/auth.dto.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), AuthController.login);

router.post('/request-password-reset', validateRequest(requestPasswordResetSchema), AuthController.requestPasswordReset);
router.post('/reset-password-with-otp', validateRequest(resetPasswordWithOtpSchema), AuthController.resetPasswordWithOtp);

export default router; 