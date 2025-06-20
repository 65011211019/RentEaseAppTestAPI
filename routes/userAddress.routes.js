import express from 'express';
import UserAddressController from '../controllers/userAddress.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all addresses for the current user
router.get('/', UserAddressController.getAllAddresses);

// Get a specific address
router.get('/:addressId', UserAddressController.getAddress);

// Create a new address
router.post('/', UserAddressController.createAddress);

// Update an existing address
router.put('/:addressId', UserAddressController.updateAddress);

// Delete an address
router.delete('/:addressId', UserAddressController.deleteAddress);

export default router; 