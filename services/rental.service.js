import RentalModel from '../models/rental.model.js';
import ProductModel from '../models/product.model.js';
import UserAddressModel from '../models/userAddress.model.js';
import SystemSettingModel from '../models/systemSetting.model.js';
import RentalStatusHistoryModel from '../models/rentalStatusHistory.model.js';
import PaymentTransactionModel from '../models/payment_transaction.model.js'; // For manual payment proof
import FileService from './file.service.js'; // For payment proof upload
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';
import NotificationService from './notification.service.js';

const RentalService = {
    async createRentalRequest(renterId, rentalRequestData) {
        const { product_id, start_date, end_date, pickup_method, delivery_address_id, notes_from_renter } = rentalRequestData;

        const product = await ProductModel.findByIdOrSlug(product_id); // Uses forUpdate = false by default
        if (!product || product.availability_status !== 'available' || product.admin_approval_status !== 'approved') {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Product not available or not found.");
        }
        if (product.owner_id === renterId) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "You cannot rent your own product.");
        }
        if (product.quantity_available < 1 && product.quantity > 0) { // Check if quantity > 0 for products that track it
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Product is currently out of stock for rental.");
        }

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        const rentalDurationDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

        if (rentalDurationDays < (product.min_rental_duration_days || 1)) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Minimum rental duration is ${product.min_rental_duration_days || 1} days.`);
        }
        if (product.max_rental_duration_days && rentalDurationDays > product.max_rental_duration_days) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Maximum rental duration is ${product.max_rental_duration_days} days.`);
        }

        let validDeliveryAddressId = null;
        if (pickup_method === 'delivery') {
            if (!delivery_address_id) {
                throw new ApiError(httpStatusCodes.BAD_REQUEST, "Delivery address is required for delivery pickup method.");
            }
            const address = await UserAddressModel.findByIdAndUserId(delivery_address_id, renterId);
            if (!address) {
                throw new ApiError(httpStatusCodes.BAD_REQUEST, "Invalid delivery address ID.");
            }
            validDeliveryAddressId = address.id;
        }

        const subtotalRentalFee = product.rental_price_per_day * rentalDurationDays;
        let deliveryFee = 0;
        if (pickup_method === 'delivery') {
            const defaultDeliveryFeeSetting = await SystemSettingModel.getSetting('default_delivery_fee', '0');
            deliveryFee = parseFloat(defaultDeliveryFeeSetting.setting_value) || 0;
        }
        let platformFeeRenter = 0;
        const platformFeeRenterPercentSetting = await SystemSettingModel.getSetting('platform_fee_renter_percentage', '0');
        const platformFeeRenterPercent = parseFloat(platformFeeRenterPercentSetting.setting_value) / 100 || 0;
        if (platformFeeRenterPercent > 0) {
            platformFeeRenter = subtotalRentalFee * platformFeeRenterPercent;
        }
        let platformFeeOwner = 0;
        const platformFeeOwnerPercentSetting = await SystemSettingModel.getSetting('platform_fee_owner_percentage', '0');
        const platformFeeOwnerPercent = parseFloat(platformFeeOwnerPercentSetting.setting_value) / 100 || 0;
        if (platformFeeOwnerPercent > 0) {
            platformFeeOwner = subtotalRentalFee * platformFeeOwnerPercent;
        }
        const securityDeposit = product.security_deposit || 0;
        const totalAmountDue = subtotalRentalFee + securityDeposit + deliveryFee + platformFeeRenter;
        
        // const requiresOwnerApproval = product.settings?.requires_approval ?? true; // Example if product has such setting
        const requiresOwnerApproval = true; // Default for now
        let initialRentalStatus = requiresOwnerApproval ? 'pending_owner_approval' : 'pending_payment';
        let initialPaymentStatus = 'unpaid';

        const rentalPayload = {
            renter_id: renterId, product_id: product.id, owner_id: product.owner_id,
            start_date, end_date,
            rental_price_per_day_at_booking: product.rental_price_per_day,
            security_deposit_at_booking: securityDeposit,
            calculated_subtotal_rental_fee: subtotalRentalFee, delivery_fee: deliveryFee,
            platform_fee_renter: platformFeeRenter, platform_fee_owner: platformFeeOwner, total_amount_due: totalAmountDue,
            pickup_method, return_method: pickup_method === 'delivery' ? 'owner_pickup' : 'self_return',
            delivery_address_id: validDeliveryAddressId, rental_status: initialRentalStatus,
            payment_status: initialPaymentStatus, notes_from_renter,
            return_condition_status: 'not_yet_returned',
        };
        return RentalModel.create(rentalPayload); // create will also log status history
    },

    async approveRentalRequest(rentalIdOrUid, ownerId) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental request not found.");
        }
        if (rental.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to approve this rental.");
        }
        if (rental.rental_status !== 'pending_owner_approval') {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Rental is not pending owner approval. Current status: ${rental.rental_status}`);
        }

        const product = await ProductModel.findByIdOrSlug(rental.product_id, true); // fetch for update check
         if (product.quantity_available < 1 && product.quantity > 0) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Product became unavailable while pending approval. Please reject.");
        }

        const updatedRental = await RentalModel.update(rental.id, { rental_status: 'pending_payment' });
        await RentalStatusHistoryModel.create(rental.id, 'pending_payment', ownerId, "Rental approved by owner.", rental.rental_status);
        // Notification: แจ้ง renter ว่าได้รับการอนุมัติ
        await NotificationService.createNotification({
            user_id: rental.renter_id,
            type: 'rental_approved',
            title: 'คำขอเช่าของคุณได้รับการอนุมัติ',
            message: `คำขอเช่าสินค้า ${product.title} ได้รับการอนุมัติ`,
            link_url: `/rentals/${rental.id}`,
            related_entity_type: 'rental',
            related_entity_id: rental.id,
            related_entity_uid: rental.rental_uid
        });
        return updatedRental;
    },

    async rejectRentalRequest(rentalIdOrUid, ownerId, reason) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        if (rental.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to reject this rental.");
        }
        if (rental.rental_status !== 'pending_owner_approval') {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Rental is not pending owner approval. Current status: ${rental.rental_status}`);
        }

        const updatePayload = {
            rental_status: 'rejected_by_owner',
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
            cancelled_by_user_id: ownerId
        };
        const updatedRental = await RentalModel.update(rental.id, updatePayload);
        await RentalStatusHistoryModel.create(rental.id, 'rejected_by_owner', ownerId, `Rejected: ${reason}`, rental.rental_status);
        // Notification: แจ้ง renter ว่าถูกปฏิเสธ
        await NotificationService.createNotification({
            user_id: rental.renter_id,
            type: 'rental_rejected',
            title: 'คำขอเช่าของคุณถูกปฏิเสธ',
            message: `คำขอเช่าสินค้า ${rental.product_id} ถูกปฏิเสธ: ${reason}`,
            link_url: `/rentals/${rental.id}`,
            related_entity_type: 'rental',
            related_entity_id: rental.id,
            related_entity_uid: rental.rental_uid
        });
        return updatedRental;
    },

    async submitPaymentProof(rentalIdOrUid, renterId, fileObject, paymentDetails) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        if (rental.renter_id !== renterId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized for this rental.");
        }
        if (rental.rental_status !== 'pending_payment') {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Rental is not pending payment. Current status: ${rental.rental_status}`);
        }
        if (!fileObject) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, "Payment proof image is required.");
        }

        // Upload proof (e.g., to 'payment-proofs' bucket)
        const fileName = `rental-${rental.id}-proof-${Date.now()}.${fileObject.originalname.split('.').pop()}`;
        const filePath = `public/${fileName}`; // Adjust path as needed
        const { publicUrl: proofUrl } = await FileService.uploadFileToSupabaseStorage(fileObject, 'payment-proofs', filePath);

        if (!proofUrl) {
            throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload payment proof.");
        }

        const amountPaid = paymentDetails.amount_paid ? parseFloat(paymentDetails.amount_paid) : rental.total_amount_due;

        const updatePayload = {
            payment_proof_url: proofUrl,
            rental_status: 'confirmed',
            payment_status: 'pending_verification', // Or 'paid' if auto-verified
            final_amount_paid: amountPaid
        };
        const updatedRental = await RentalModel.update(rental.id, updatePayload);
        await RentalStatusHistoryModel.create(rental.id, 'confirmed', renterId, "Payment proof submitted.", rental.rental_status);

        // Create payment transaction record
        await PaymentTransactionModel.create({
            rental_id: rental.id,
            user_id: renterId,
            transaction_type: 'rental_payment',
            amount: amountPaid,
            currency: 'THB', // Assuming THB
            status: 'pending', // Or 'successful' if auto-verified
            payment_method_name: 'manual_bank_transfer',
            payment_method_details: {
                transaction_time: paymentDetails.transaction_time || new Date().toISOString(),
                proof_url: proofUrl
            },
            transaction_time: paymentDetails.transaction_time ? new Date(paymentDetails.transaction_time) : new Date(),
        });
        
        // TODO: Send notification to Owner/Admin for verification
        // If auto-verified (e.g. amount matches perfectly)
        // then update product quantity_available here
        // For Day 4, manual verification is assumed to happen later by Admin/Owner
        // If rental_status became 'confirmed' here, then:
        // await ProductModel.updateQuantityAvailable(rental.product_id, -1);

        return updatedRental;
    },

    async checkRentalPaymentStatus(rentalIdOrUid, userId) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        // Ensure user is either renter or owner (or admin later)
        if (rental.renter_id !== userId && rental.owner_id !== userId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to view this rental's payment status.");
        }
        return { payment_status: rental.payment_status, rental_status: rental.rental_status };
    },

    async cancelRentalByUser(rentalIdOrUid, userId, reason) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }

        // Policy: Renter can cancel if pending_owner_approval, pending_payment.
        // Owner can cancel if ... (different logic, maybe different endpoint)
        // For this function, assume it's the renter cancelling.
        if (rental.renter_id !== userId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to cancel this rental.");
        }

        const cancellableStatuses = ['pending_owner_approval', 'pending_payment', 'confirmed'];
        if (!cancellableStatuses.includes(rental.rental_status)) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Rental cannot be cancelled. Current status: ${rental.rental_status}`);
        }
        // Add more specific cancellation policies (e.g., before X days of start_date if 'confirmed')

        const updatePayload = {
            rental_status: 'cancelled_by_renter',
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
            cancelled_by_user_id: userId
        };
        const updatedRental = await RentalModel.update(rental.id, updatePayload);
        await RentalStatusHistoryModel.create(rental.id, 'cancelled_by_renter', userId, `Cancelled by renter: ${reason}`, rental.rental_status);

        // If product quantity was decremented, increment it back
        if (['confirmed', 'active'].includes(rental.rental_status) && rental.product?.id) {
            try {
                 await ProductModel.updateQuantityAvailable(rental.product.id, 1);
            } catch (qtyError) {
                 console.error("Error restoring product quantity after cancellation:", qtyError);
            }
        }

        // Notification: แจ้ง owner ว่าผู้เช่ายกเลิก
        await NotificationService.createNotification({
            user_id: rental.owner_id,
            type: 'rental_cancelled',
            title: 'ผู้เช่ายกเลิกการเช่า',
            message: `ผู้เช่ายกเลิกการเช่าสินค้า รหัส ${rental.id}`,
            link_url: `/rentals/${rental.id}`,
            related_entity_type: 'rental',
            related_entity_id: rental.id,
            related_entity_uid: rental.rental_uid
        });
        return updatedRental;
    },

    async getRentalsForUser(userId, userRole, filters = {}) {
        return RentalModel.findForUser(userId, userRole, filters);
    },

    async getRentalDetailsForUser(rentalIdOrUid, userId) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        if (rental.renter_id !== userId && rental.owner_id !== userId) {
            // Later, an admin check can be added here
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to view this rental.");
        }
        // Optionally, fetch more related data like full payment transaction history
        // rental.payment_transactions = await PaymentTransactionModel.findByRentalId(rental.id);
        return rental;
    },

    // Placeholder for Renter Dashboard specific data fetching
    async getRenterDashboardData(renterId) {
        const activeRentals = await RentalModel.findForUser(renterId, 'renter', { status: 'active', limit: 5 });
        const confirmed = await RentalModel.findForUser(renterId, 'renter', { status: 'confirmed', limit: 3 });
        const pendingPayment = await RentalModel.findForUser(renterId, 'renter', { status: 'pending_payment', limit: 3 });
        const pendingApproval = await RentalModel.findForUser(renterId, 'renter', { status: 'pending_owner_approval', limit: 3 });
        const completed = await RentalModel.findForUser(renterId, 'renter', { status: 'completed', limit: 3 });
        const cancelled = await RentalModel.findForUser(renterId, 'renter', { status: ['cancelled_by_renter','cancelled_by_owner','rejected_by_owner'], limit: 3 });
        const lateReturn = await RentalModel.findForUser(renterId, 'renter', { status: 'late_return', limit: 3 });
        // TODO: ดึง wishlist_summary จาก WishlistService ถ้ามี
        return {
            current_active_rentals: {
                data: activeRentals.data,
                total: activeRentals.pagination.total
            },
            confirmed_rentals: {
                data: confirmed.data,
                total: confirmed.pagination.total
            },
            pending_action_rentals: {
                data: pendingPayment.data,
                total: pendingPayment.pagination.total
            },
            pending_approval_rentals: {
                data: pendingApproval.data,
                total: pendingApproval.pagination.total
            },
            completed_rentals: {
                data: completed.data,
                total: completed.pagination.total
            },
            cancelled_rentals: {
                data: cancelled.data,
                total: cancelled.pagination.total
            },
            late_return_rentals: {
                data: lateReturn.data,
                total: lateReturn.pagination.total
            },
            // wishlist_summary: ...
        };
    },

    async processReturn(rentalIdOrUid, ownerId, returnData, imageFiles = []) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        if (rental.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to process return for this rental.");
        }
        const validStatusesForReturn = ['active', 'return_pending', 'late_return'];
        if (!validStatusesForReturn.includes(rental.rental_status)) {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Cannot process return. Rental status is '${rental.rental_status}'.`);
        }

        const { actual_return_time, return_condition_status, notes_from_owner_on_return, initiate_claim } = returnData;
        
        const updatePayload = {
            actual_return_time,
            return_condition_status,
            notes_from_owner_on_return,
            updated_at: new Date().toISOString()
        };

        let newRentalStatus = 'completed';
        if (initiate_claim && (return_condition_status === 'damaged' || return_condition_status === 'lost')) {
            newRentalStatus = 'dispute';
        }
        updatePayload.rental_status = newRentalStatus;

        // Handle return condition images
        if (imageFiles && imageFiles.length > 0) {
            const imageUrls = [];
            const bucketName = 'return-condition-images';
            for (const file of imageFiles) {
                const fileName = `rental-${rental.id}-return-${Date.now()}-${file.originalname}`;
                const { publicUrl } = await FileService.uploadFileToSupabaseStorage(file, bucketName, `public/${fileName}`);
                if (publicUrl) imageUrls.push(publicUrl);
            }
            updatePayload.return_condition_image_urls = imageUrls;
        }

        const updatedRental = await RentalModel.update(rental.id, updatePayload);
        await RentalStatusHistoryModel.create(
            rental.id, 
            newRentalStatus, 
            ownerId, 
            `Return processed. Condition: ${return_condition_status}. Notes: ${notes_from_owner_on_return || ''}`, 
            rental.rental_status
        );

        if (newRentalStatus === 'completed') {
            // Return product quantity if it was managed per rental instance
            try {
                if (rental.product_id) {
                    await ProductModel.updateQuantityAvailable(rental.product_id, 1);
                }
            } catch (qtyError) {
                console.error("Error restoring product quantity after completion:", qtyError);
            }
            // TODO: Trigger payout process for owner if applicable
            // TODO: Send notification to renter about completion
        } else if (newRentalStatus === 'dispute') {
            // The frontend should guide the owner to the claim creation page
            // TODO: Send notification to renter about dispute
        }
        
        return updatedRental;
    },

    async verifyRentalPaymentByOwner(rentalIdOrUid, ownerId, { amount_paid } = {}) {
        const rental = await RentalModel.findByIdentifier(rentalIdOrUid);
        if (!rental) {
            throw new ApiError(httpStatusCodes.NOT_FOUND, "Rental not found.");
        }
        if (rental.owner_id !== ownerId) {
            throw new ApiError(httpStatusCodes.FORBIDDEN, "You are not authorized to verify payment for this rental.");
        }
        if (rental.payment_status !== 'pending_verification') {
            throw new ApiError(httpStatusCodes.BAD_REQUEST, `Rental payment is not pending verification. Current status: ${rental.payment_status}`);
        }
        // อัปเดตสถานะ
        const updatePayload = {
            payment_status: 'paid',
            rental_status: rental.rental_status === 'confirmed' ? 'active' : rental.rental_status, // ถ้า confirmed ให้ active, ถ้า active อยู่แล้วไม่เปลี่ยน
            final_amount_paid: amount_paid ? parseFloat(amount_paid) : rental.final_amount_paid || rental.total_amount_due,
            payment_verified_at: new Date().toISOString(),
            payment_verified_by_user_id: ownerId
        };
        const updatedRental = await RentalModel.update(rental.id, updatePayload);
        await RentalStatusHistoryModel.create(
            rental.id,
            updatePayload.rental_status,
            ownerId,
            "Payment verified by owner.",
            rental.rental_status
        );
        // Notification: แจ้ง renter ว่าชำระเงินสำเร็จ
        await NotificationService.createNotification({
            user_id: rental.renter_id,
            type: 'payment_verified',
            title: 'ชำระเงินสำเร็จ',
            message: 'เจ้าของได้ยืนยันการชำระเงินของคุณแล้ว',
            link_url: `/rentals/${rental.id}`,
            related_entity_type: 'rental',
            related_entity_id: rental.id,
            related_entity_uid: rental.rental_uid
        });
        return updatedRental;
    }
};

export default RentalService; 