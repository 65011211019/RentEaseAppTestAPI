import express from 'express';
import ProvinceController from '../controllers/province.controller.js';

const router = express.Router();

router.get('/', ProvinceController.getAll);

export default router; 