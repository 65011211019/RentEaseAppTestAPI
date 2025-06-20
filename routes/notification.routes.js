import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import authenticateJWT from '../middleware/authenticateJWT.js';

const router = express.Router();
router.use(authenticateJWT);

// GET /api/notifications
router.get('/', NotificationController.getMyNotifications);

// POST /api/notifications/mark-read
router.post('/mark-read', NotificationController.markAsRead);

export default router; 