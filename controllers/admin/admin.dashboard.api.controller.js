// controllers/admin/admin.dashboard.api.controller.js

const Order = require("../../models/order.model");
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const Category = require("../../models/category.model");
const Review = require("../../models/review.model");
const moment = require("moment");

// Helper: Format ngày tháng cho MongoDB $dateToString
const getDateFormat = (groupBy) => {
    switch (groupBy) {
        case "week":
            return "%Y-%U"; // Tuần
        case "month":
            return "%Y-%m"; // Tháng
        case "quarter":
            return {
                $concat: [
                    { $toString: { $year: "$createdAt" } },
                    "-Q",
                    {
                        $toString: {
                            $ceil: { $divide: [{ $month: "$createdAt" }, 3] },
                        },
                    },
                ],
            };
        case "year":
            return "%Y"; // Năm
        default:
            return "%Y-%m-%d"; // Ngày
    }
};

// Helper: Tạo danh sách nhãn (Labels) liên tục
const generateDateLabels = (startDate, endDate, groupBy) => {
    const labels = [];
    let current = moment(startDate);
    const end = moment(endDate);
    let format, unit;

    switch (groupBy) {
        case "week":
            format = "YYYY-[W]WW";
            unit = "week";
            break;
        case "month":
            format = "YYYY-MM";
            unit = "month";
            break;
        case "quarter":
            while (current.isSameOrBefore(end)) {
                labels.push(current.format("YYYY-[Q]Q"));
                current.add(1, "quarter");
            }
            return labels;
        case "year":
            format = "YYYY";
            unit = "year";
            break;
        default:
            format = "YYYY-MM-DD";
            unit = "day";
    }

    while (current.isSameOrBefore(end)) {
        labels.push(current.format(format));
        current.add(1, unit);
    }
    return labels;
};

const getChartData = async (req, res) => {
    try {
        // 1. Xử lý tham số thời gian
        const defaultStart = moment().startOf("year");
        const defaultEnd = moment().endOf("day");

        const startDate = req.query.start
            ? moment(req.query.start).startOf("day")
            : defaultStart;
        const endDate = req.query.end
            ? moment(req.query.end).endOf("day")
            : defaultEnd;

        // Tự động chọn groupBy nếu không có
        let groupBy = req.query.groupBy;
        if (!groupBy) {
            const diffDays = endDate.diff(startDate, "days");
            if (diffDays > 365) groupBy = "year";
            else if (diffDays > 120) groupBy = "quarter";
            else if (diffDays > 60) groupBy = "month";
            else if (diffDays > 31) groupBy = "week";
            else groupBy = "day";
        }

        const dateFormat = getDateFormat(groupBy);

        // 2. Truy vấn dữ liệu (Aggregation)
        const [orderStats, userStats, topProducts, categoryStats, reviewStats] =
            await Promise.all([
                // A. Dữ liệu Đơn hàng (Line Chart & Stat Cards)
                Order.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                        },
                    },
                    {
                        $facet: {
                            // A1. Theo thời gian (Time Series)
                            timeSeries: [
                                { $match: { paymentStatus: "Paid" } },
                                {
                                    $group: {
                                        _id: {
                                            $dateToString: {
                                                format: dateFormat,
                                                date: "$createdAt",
                                            },
                                        },
                                        revenue: { $sum: "$total" },
                                        orders: { $sum: 1 },
                                        productsSold: {
                                            $sum: { $size: "$items" },
                                        },
                                    },
                                },
                                { $sort: { _id: 1 } },
                            ],
                            // A2. Tổng hợp (Stat Cards & Pie Chart)
                            summary: [
                                {
                                    $group: {
                                        _id: null,
                                        totalOrders: { $sum: 1 },
                                        totalRevenue: {
                                            $sum: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$paymentStatus",
                                                            "Paid",
                                                        ],
                                                    },
                                                    "$total",
                                                    0,
                                                ],
                                            },
                                        },
                                        countCOD: {
                                            $sum: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$paymentMethod",
                                                            "COD",
                                                        ],
                                                    },
                                                    1,
                                                    0,
                                                ],
                                            },
                                        },
                                        countVNPAY: {
                                            $sum: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$paymentMethod",
                                                            "VNPAY",
                                                        ],
                                                    },
                                                    1,
                                                    0,
                                                ],
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ]),

                // B. Dữ liệu Người dùng (New Users Time Series)
                User.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                            roles: "customer",
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: dateFormat,
                                    date: "$createdAt",
                                },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]),

                // C. Top Sản phẩm (Bar Chart) - Chỉ tính đơn đã thanh toán
                Order.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                            paymentStatus: "Paid",
                        },
                    },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: "$items.name",
                            sold: { $sum: "$items.quantity" },
                            revenue: {
                                $sum: {
                                    $multiply: [
                                        "$items.price",
                                        "$items.quantity",
                                    ],
                                },
                            },
                        },
                    },
                    { $sort: { sold: -1 } },
                    { $limit: 5 },
                ]),

                // D. Loại sản phẩm (Category Doughnut)
                Order.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                            paymentStatus: "Paid",
                        },
                    },
                    { $unwind: "$items" },
                    {
                        $lookup: {
                            from: "products",
                            localField: "items.productId",
                            foreignField: "_id",
                            as: "prod",
                        },
                    },
                    { $unwind: "$prod" },
                    { $unwind: "$prod.categoryIds" },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "prod.categoryIds",
                            foreignField: "_id",
                            as: "cat",
                        },
                    },
                    { $unwind: "$cat" },
                    {
                        $group: {
                            _id: "$cat.name",
                            revenue: {
                                $sum: {
                                    $multiply: [
                                        "$items.price",
                                        "$items.quantity",
                                    ],
                                },
                            },
                        },
                    },
                    { $sort: { revenue: -1 } },
                    { $limit: 6 },
                ]),

                Review.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: "$sentiment",
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);

        // 3. Xử lý và Format dữ liệu trả về
        const labels = generateDateLabels(startDate, endDate, groupBy);

        // Map Time Series Data
        const orderMap = orderStats[0].timeSeries.reduce(
            (acc, i) => ({ ...acc, [i._id]: i }),
            {}
        );
        const userMap = userStats.reduce(
            (acc, i) => ({ ...acc, [i._id]: i }),
            {}
        );

        const chartData = {
            labels: labels,
            revenue: labels.map((l) => orderMap[l]?.revenue || 0),
            profit: labels.map((l) => (orderMap[l]?.revenue || 0) * 0.3),
            orders: labels.map((l) => orderMap[l]?.orders || 0),
            newUsers: labels.map((l) => userMap[l]?.count || 0),
        };

        // Map Summary Data
        const summary = orderStats[0].summary[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            countCOD: 0,
            countVNPAY: 0,
        };

        // Map Top Products
        const topProdData = {
            labels: topProducts.map((p) => p._id),
            data: topProducts.map((p) => p.sold),
        };

        // Map Categories
        const catData = {
            labels: categoryStats.map((c) => c._id),
            data: categoryStats.map((c) => c.revenue),
        };

        // Lấy tổng User toàn hệ thống (để hiển thị Total Users)
        const totalUsersAllTime = await User.countDocuments({
            roles: "customer",
        });

        const sentimentMap = { Positive: 0, Negative: 0, Neutral: 0 };
        reviewStats.forEach((s) => {
            if (s._id) sentimentMap[s._id] = s.count;
        });

        res.json({
            ok: true,
            stats: {
                totalRevenue: summary.totalRevenue,
                totalProfit: summary.totalRevenue * 0.3,
                totalOrders: summary.totalOrders,
                newUsersInPeriod: userStats.reduce((a, b) => a + b.count, 0),
                totalUsers: totalUsersAllTime,
            },
            charts: {
                main: chartData,
                payment: [summary.countCOD, summary.countVNPAY],
                products: topProdData,
                categories: catData,
                sentiment: [
                    sentimentMap.Positive,
                    sentimentMap.Neutral,
                    sentimentMap.Negative,
                ],
            },
        });
    } catch (err) {
        console.error("Dashboard API Error:", err);
        res.status(500).json({ ok: false, message: "Lỗi lấy dữ liệu báo cáo" });
    }
};

module.exports = { getChartData };
