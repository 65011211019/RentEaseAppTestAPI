import express from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import provinceRouter from './province.routes.js';
import categoryRouter from './category.routes.js';
import productRouter from './product.routes.js';
import ownerRouter from './owner.routes.js';
import rentalRouter from './rental.routes.js';
import userAddressRouter from './userAddress.routes.js';
import renterRouter from './renter.routes.js';
import webhookRouter from './webhook.routes.js';
import claimRouter from './claim.routes.js';
import chatRouter from './chat.routes.js';
import notificationRoutes from './notification.routes.js';
// Import other routers as they are created in subsequent days

const router = express.Router();

// Log request body for debugging
router.use((req, res, next) => {
    // console.log('Router Request Body:', req.body); // Keep for debugging if needed
    next();
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/users/me/addresses', userAddressRouter);
router.use('/provinces', provinceRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/owners', ownerRouter);
router.use('/renters', renterRouter);
router.use('/rentals', rentalRouter);
router.use('/claims', claimRouter);
router.use('/webhooks', webhookRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationRoutes);
// router.use('/products', productRouter); etc.

// A simple health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'RentEase API is running!' });
});

// เพิ่ม endpoint GET / (root) สำหรับ API overview
router.get('/', (req, res) => {
    res.status(200).json({
        name: 'RentEase API',
        version: '1.0.0',
        description: 'API for the RentEase platform',
        author: 'NISIO',
        time: new Date().toISOString(),
        docs: 'https://github.com/yourusername/rentease-api' // ปรับ URL ตามจริงถ้ามี
    });
});

export default router;