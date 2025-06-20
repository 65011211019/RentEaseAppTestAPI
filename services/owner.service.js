import ProductModel from '../models/product.model.js';
import RentalModel from '../models/rental.model.js'; // For future rental stats
import supabase from '../db/supabaseClient.js';

const OwnerService = {
    async getOwnerDashboardStats(ownerId) {
        // 1. Total products
        const { count: totalMyProducts, error: productError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId)
            .is('deleted_at', null);

        // 2. Active rentals count (rental_status: 'active')
        const { count: activeRentalsCount, error: activeError } = await supabase
            .from('rentals')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId)
            .eq('rental_status', 'active');

        // 3. Estimated monthly revenue (sum owner_payout_amount ของ rentals ที่จบเดือนนี้และจ่ายเงินแล้ว)
        // เงื่อนไข: owner_id, payment_status = 'paid', actual_return_time ในเดือนนี้
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        const { data: revenueRows, error: revenueError } = await supabase
            .from('rentals')
            .select('owner_payout_amount, actual_return_time')
            .eq('owner_id', ownerId)
            .eq('payment_status', 'paid')
            .gte('actual_return_time', monthStart)
            .lte('actual_return_time', monthEnd);
        let estimatedMonthlyRevenue = 0;
        if (revenueRows && Array.isArray(revenueRows)) {
            estimatedMonthlyRevenue = revenueRows.reduce((sum, r) => sum + (parseFloat(r.owner_payout_amount) || 0), 0);
        }

        // 4. Pending rental requests (rental_status: 'pending_owner_approval')
        const { count: pendingRentalRequestsCount, error: pendingError } = await supabase
            .from('rentals')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId)
            .eq('rental_status', 'pending_owner_approval');

        if (productError) console.error("Error fetching owner product count:", productError);
        if (activeError) console.error("Error fetching active rentals count:", activeError);
        if (revenueError) console.error("Error fetching monthly revenue:", revenueError);
        if (pendingError) console.error("Error fetching pending rental requests:", pendingError);

        return {
            total_my_products: totalMyProducts || 0,
            active_rentals_count: activeRentalsCount || 0,
            estimated_monthly_revenue: estimatedMonthlyRevenue,
            pending_rental_requests_count: pendingRentalRequestsCount || 0,
            // recent_notifications: [], // TODO
            // upcoming_returns: [], // TODO
            // pending_rental_requests_summary: [] // TODO
        };
    }
};

export default OwnerService; 