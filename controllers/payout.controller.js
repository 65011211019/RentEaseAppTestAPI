import PayoutService from '../services/payout.service.js';
import { payoutMethodSchema } from '../DTOs/payout.dto.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import validateRequest from '../middleware/validateRequest.js';

const PayoutController = {
    async getPayoutMethods(req, res, next) {
        try {
            const ownerId = req.user.id;
            const result = await PayoutService.getPayoutMethods(ownerId);

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getPayoutMethod(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { methodId } = req.params;

            const result = await PayoutService.getPayoutMethod(ownerId, methodId);

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async createPayoutMethod(req, res, next) {
        try {
            const ownerId = req.user.id;
            const methodData = req.body;

            const result = await PayoutService.createPayoutMethod(ownerId, methodData);

            res.status(httpStatusCodes.CREATED).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async updatePayoutMethod(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { methodId } = req.params;
            const methodData = req.body;

            const result = await PayoutService.updatePayoutMethod(
                ownerId,
                methodId,
                methodData
            );

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async deletePayoutMethod(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { methodId } = req.params;

            const result = await PayoutService.deletePayoutMethod(ownerId, methodId);

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async setPrimaryPayoutMethod(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { methodId } = req.params;

            const result = await PayoutService.setPrimaryPayoutMethod(ownerId, methodId);

            res.status(httpStatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    // Public: Get payout methods by ownerId (for renters to see owner's bank details)
    async getPayoutMethodsByOwnerId(req, res, next) {
        try {
            const { ownerId } = req.params;
            const result = await PayoutService.getPayoutMethods(ownerId);
            // Return only public fields
            const publicFields = result.map(method => ({
                id: method.id,
                method_type: method.method_type,
                account_name: method.account_name,
                account_number: method.account_number,
                bank_name: method.bank_name,
                is_primary: method.is_primary
            }));
            res.status(httpStatusCodes.OK).json({
                success: true,
                data: publicFields
            });
        } catch (error) {
            next(error);
        }
    }
};

export default PayoutController; 