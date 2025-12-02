// controllers/admin/dashboard.controller.js
const User = require("../../models/user.model");
const Order = require("../../models/order.model");

// Hàm helper để render
function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`,
        ...data,
    });
}

const getDashboard = async (req, res, next) => {
    try {
        const [userCount, orderCount, revenueData] = await Promise.all([
            // 1. Đếm tổng số khách hàng
            User.countDocuments({ roles: "customer" }),

            // 2. Đếm tất cả đơn hàng
            Order.countDocuments(),

            // 3. Tính tổng doanh thu (chỉ từ các đơn đã thanh toán)
            Order.aggregate([
                { $match: { paymentStatus: "Paid" } },
                { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
            ]),
        ]);

        const revenue = revenueData[0]?.totalRevenue || 0;

        const stats = {
            userCount: userCount,
            orderCount: orderCount,
            revenue: revenue,
        };

        render(res, "index", {
            title: "Dashboard",
            stats: stats,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getDashboard };
