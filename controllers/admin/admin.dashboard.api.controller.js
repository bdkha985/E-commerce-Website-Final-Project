// controllers/admin/admin.dashboard.api.controller.js
const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const moment = require('moment');

const getDateFormat = (groupBy) => {
    switch (groupBy) {
        case 'week': return '%Y-%U';
        case 'month': return '%Y-%m';
        case 'quarter':
            return { $concat: [ { $toString: { $year: "$createdAt" } }, "-Q", { $toString: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } }} ] };
        case 'year': return '%Y';
        default: return '%Y-%m-%d';
    }
};
const generateDateLabels = (startDate, endDate, groupBy) => {
    // ... (Giữ nguyên logic hàm này) ...
    const labels = [];
    let current = moment(startDate);
    const end = moment(endDate);
    let format, unit;
    switch (groupBy) {
        case 'week': format = 'YYYY-[W]WW'; unit = 'week'; break;
        case 'month': format = 'YYYY-MM'; unit = 'month'; break;
        case 'year': format = 'YYYY'; unit = 'year'; break;
        default: format = 'YYYY-MM-DD'; unit = 'day';
    }
    if (groupBy === 'quarter') {
         while (current.isSameOrBefore(end)) {
            labels.push(current.format('YYYY-[Q]Q'));
            current.add(1, 'quarter');
        }
        return labels;
    }
    while (current.isSameOrBefore(end)) {
        labels.push(current.format(format));
        current.add(1, unit);
    }
    return labels;
};


// GET /admin/api/chart-data
const getChartData = async (req, res) => {
    try {
        // 1. Lấy tham số ngày tháng
        const defaultStart = moment().subtract(29, 'days').startOf('day');
        const defaultEnd = moment().endOf('day');
        const startDate = req.query.start ? moment(req.query.start).startOf('day') : defaultStart;
        const endDate = req.query.end ? moment(req.query.end).endOf('day') : defaultEnd;
        
        const diffDays = endDate.diff(startDate, 'days');
        let groupBy = 'day';
        if (diffDays > 90) groupBy = 'month';
        else if (diffDays > 31) groupBy = 'week';

        const dateFormat = getDateFormat(groupBy);
        
        // 2. Chạy 3 truy vấn song song
        const [orderResults, userResults, statResults] = await Promise.all([
            
            // Query 1: Lấy dữ liệu Đơn hàng (Revenue, Paid Orders, Total Orders)
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() } } },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                        totalRevenue: { 
                            $sum: { $cond: [ { $eq: ["$paymentStatus", "Paid"] }, "$total", 0 ] } 
                        },
                        totalPaidOrders: { // Đơn hàng đã thanh toán
                            $sum: { $cond: [ { $eq: ["$paymentStatus", "Paid"] }, 1, 0 ] }
                        },
                        totalOrders: { $sum: 1 } // Tất cả đơn hàng
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Query 2: Lấy dữ liệu Người dùng mới
            User.aggregate([
                { $match: { createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() } } },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                        newUsers: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Query 3: Lấy dữ liệu Thẻ Thống kê (Stat Cards)
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() } } },
                { $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: { $cond: [ { $eq: ["$paymentStatus", "Paid"] }, "$total", 0 ] } },
                    totalCOD: { $sum: { $cond: [ { $eq: ["$paymentMethod", "COD"] }, 1, 0 ] } },
                    totalVNPAY: { $sum: { $cond: [ { $eq: ["$paymentMethod", "VNPAY"] }, 1, 0 ] } },
                    totalPaid: { $sum: { $cond: [ { $eq: ["$paymentStatus", "Paid"] }, 1, 0 ] } },
                    totalPending: { $sum: { $cond: [ { $eq: ["$paymentStatus", "Pending"] }, 1, 0 ] } }
                }}
            ])
        ]);

        // 3. Xử lý và Hợp nhất Dữ liệu
        const labels = generateDateLabels(startDate, endDate, groupBy);

        // Tạo Maps
        const orderMap = orderResults.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});
        const userMap = userResults.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});
        
        // Tạo các mảng dữ liệu
        const revenueData = labels.map(label => orderMap[label]?.totalRevenue || 0);
        const paidOrdersData = labels.map(label => orderMap[label]?.totalPaidOrders || 0);
        const totalOrdersData = labels.map(label => orderMap[label]?.totalOrders || 0);
        const newUsersData = labels.map(label => userMap[label]?.newUsers || 0);

        // 4. Xử lý Stat Cards
        const statData = statResults[0] || {};
        const aggregateStats = {
            totalOrders: statData.totalOrders || 0,
            totalRevenue: statData.totalRevenue || 0,
            totalCOD: statData.totalCOD || 0,
            totalVNPAY: statData.totalVNPAY || 0,
            totalPaid: statData.totalPaid || 0,
            totalPending: statData.totalPending || 0,
        };

        // 5. Trả về JSON
        res.json({
            ok: true,
            labels,
            revenueData,     // Mới
            paidOrdersData,  // Mới
            totalOrdersData, // Mới
            newUsersData,    // Mới
            aggregateStats 
        });

    } catch (err) {
        console.error("Lỗi getChartData:", err);
        res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
    }
};

module.exports = { getChartData };