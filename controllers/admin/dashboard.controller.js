// controllers/admin/dashboard.controller.js
const User = require('../../models/user.model');
const Order = require('../../models/order.model');

// Hàm helper để render (tránh lặp code)
function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`, // Path đã được chuẩn hóa
        ...data,
    });
}

const getDashboard = async (req, res, next) => {
    try {
        // === KÍCH HOẠT TRUY VẤN THẬT ===
        const [userCount, orderCount, revenueData] = await Promise.all([
            // 1. Đếm tổng số khách hàng (không đếm admin)
            User.countDocuments({ roles: 'customer' }),
            
            // 2. Đếm tất cả đơn hàng
            Order.countDocuments(),
            
            // 3. Tính tổng doanh thu (chỉ từ các đơn đã thanh toán)
            Order.aggregate([
                { $match: { paymentStatus: 'Paid' } }, 
                { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
            ])
        ]);

        const revenue = revenueData[0]?.totalRevenue || 0;

        // Dùng dữ liệu thật
        const stats = {
            userCount: userCount,
            orderCount: orderCount,
            revenue: revenue,
        };
        // === KẾT THÚC KÍCH HOẠT ===

        render(res, "index", { // Render view 'pages/admin/index'
            title: "Dashboard",
            stats: stats,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getDashboard };