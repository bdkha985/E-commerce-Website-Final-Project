// controllers/admin/dashboard.controller.js
const User = require('../../models/user.model');
const Order = require('../../models/order.model');

const getDashboard = async (req, res, next) => {
    try {
        // (Sau này chúng ta sẽ kích hoạt các dòng này để lấy dữ liệu thật)
        // const userCount = await User.countDocuments({ roles: 'customer' });
        // const orderCount = await Order.countDocuments();
        // const revenueData = await Order.aggregate([
        //     { $match: { status: 'Delivered' } }, // (Chỉ tính đơn đã giao thành công)
        //     { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        // ]);
        // const revenue = revenueData[0]?.totalRevenue || 0;

        // Dùng dữ liệu giả (placeholder)
        const stats = {
            userCount: 123,
            orderCount: 456,
            revenue: 7890000,
        };

        res.render("layouts/admin", {
            title: "Dashboard",
            body: "pages/admin/index.ejs", // Đường dẫn tới file view sắp tạo
            stats: stats,
            // currentUser đã có sẵn trong res.locals
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getDashboard };