import PayoutMethodModel from '../models/payout_method.model.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const PayoutService = {
    async getPayoutMethods(ownerId) {
        return await PayoutMethodModel.findAllByOwnerId(ownerId);
    },

    async getPayoutMethod(ownerId, methodId) {
        return await PayoutMethodModel.findByIdAndOwnerId(methodId, ownerId);
    },

    async createPayoutMethod(ownerId, methodData) {
        // If this is the first payout method or marked as primary,
        // ensure it's set as primary
        if (methodData.is_primary) {
            const existingMethods = await PayoutMethodModel.findAllByOwnerId(ownerId);
            if (existingMethods.length === 0) {
                methodData.is_primary = true;
            }
        }

        return await PayoutMethodModel.create(ownerId, methodData);
    },

    async updatePayoutMethod(ownerId, methodId, methodData) {
        // If setting as primary, ensure it's the only primary method
        if (methodData.is_primary) {
            const existingMethods = await PayoutMethodModel.findAllByOwnerId(ownerId);
            const currentMethod = existingMethods.find(m => m.id === methodId);
            
            if (!currentMethod) {
                throw new ApiError(
                    httpStatusCodes.NOT_FOUND,
                    "Payout method not found"
                );
            }

            // If this is the only method, ensure it's primary
            if (existingMethods.length === 1) {
                methodData.is_primary = true;
            }
        }

        return await PayoutMethodModel.update(methodId, ownerId, methodData);
    },

    async deletePayoutMethod(ownerId, methodId) {
        const method = await PayoutMethodModel.findByIdAndOwnerId(methodId, ownerId);
        
        // If deleting the primary method and there are other methods,
        // make the next method primary
        if (method.is_primary) {
            const existingMethods = await PayoutMethodModel.findAllByOwnerId(ownerId);
            if (existingMethods.length > 1) {
                const nextMethod = existingMethods.find(m => m.id !== methodId);
                if (nextMethod) {
                    await PayoutMethodModel.update(nextMethod.id, ownerId, {
                        is_primary: true
                    });
                }
            }
        }

        return await PayoutMethodModel.delete(methodId, ownerId);
    },

    async setPrimaryPayoutMethod(ownerId, methodId) {
        const method = await PayoutMethodModel.findByIdAndOwnerId(methodId, ownerId);
        
        // Get all methods to update their primary status
        const existingMethods = await PayoutMethodModel.findAllByOwnerId(ownerId);
        
        // Update all methods to not be primary
        for (const existingMethod of existingMethods) {
            if (existingMethod.is_primary) {
                await PayoutMethodModel.update(existingMethod.id, ownerId, {
                    is_primary: false
                });
            }
        }

        // Set the selected method as primary
        return await PayoutMethodModel.update(methodId, ownerId, {
            is_primary: true
        });
    }
};

export default PayoutService; 