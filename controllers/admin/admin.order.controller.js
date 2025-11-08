// controllers/admin/admin.order.controller.js
const Order = require("../../models/order.model");
const moment = require("moment"); // Chúng ta cần moment.js để lọc ngày tháng

// Hàm helper để render (tránh lặp code)
function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`,
        ...data,
    });
}

// 1. Hiển thị Danh sách Đơn hàng (GET /admin/orders)
const listOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 20; // 20 item mỗi trang [cite: 179]
        const skip = (page - 1) * limit;

        const q = (req.query.q || '').trim();
        const filter = req.query.filter || 'all'; // Lọc thời gian (Hôm nay,...)
        const sortQuery = req.query.sort || 'newest'; // Sắp xếp
        const orderStatus = req.query.o_status || 'all'; // Lọc Trạng thái Đơn hàng
        const paymentStatus = req.query.p_status || 'all';

        let where = {}; // Điều kiện lọc
        let filterTitle = "Tất cả đơn hàng";

        // Xử lý logic lọc theo thời gian [cite: 180]
        switch (filter) {
            case "today":
                where.createdAt = {
                    $gte: moment().startOf("day").toDate(),
                    $lte: moment().endOf("day").toDate(),
                };
                filterTitle = "Hôm nay";
                break;
            case "yesterday":
                where.createdAt = {
                    $gte: moment().subtract(1, "day").startOf("day").toDate(),
                    $lte: moment().subtract(1, "day").endOf("day").toDate(),
                };
                filterTitle = "Hôm qua";
                break;
            case "this_week":
                where.createdAt = {
                    $gte: moment().startOf("week").toDate(),
                    $lte: moment().endOf("week").toDate(),
                };
                filterTitle = "Tuần này";
                break;
            case "this_month":
                where.createdAt = {
                    $gte: moment().startOf("month").toDate(),
                    $lte: moment().endOf("month").toDate(),
                };
                filterTitle = "Tháng này";
                break;
            case "custom":
                if (startDate && endDate) {
                    where.createdAt = {
                        $gte: moment(startDate).startOf("day").toDate(),
                        $lte: moment(endDate).endOf("day").toDate(),
                    };
                    filterTitle = `Từ ${startDate} đến ${endDate}`;
                }
                break;
        }

        if (q) {
            const searchRegex = new RegExp(q, "i");
            where.$or = [
                { code: searchRegex }, // Tìm theo Mã đơn
                { email: searchRegex }, // Tìm theo Email
                { "shippingAddress.fullName": searchRegex }, // Tìm theo Tên KH
                { "shippingAddress.phone": searchRegex }, // Tìm theo SĐT
            ];
            filterTitle = `Kết quả cho "${q}"`;
        }

        // === 3. BỔ SUNG: Lọc Trạng thái & Thanh toán ===
        if (orderStatus !== 'all') {
            where.status = orderStatus; // vd: "Confirmed", "Shipping"...
        }
        if (paymentStatus === 'paid') {
            where.paymentStatus = 'Paid'; // Đã thanh toán
        }
        if (paymentStatus === 'pending') {
            where.paymentStatus = 'Pending'; // Chờ thanh toán
        }
        if (paymentStatus === 'cod') {
            where.paymentMethod = 'COD'; // Là đơn COD
        }
        // === KẾT THÚC BỔ SUNG ===

        // === 4. BỔ SUNG: Logic Sắp xếp ===
        let sort = { createdAt: -1 }; // Mặc định: Mới nhất
        if (sortQuery === 'oldest') {
            sort = { createdAt: 1 }; // Cũ nhất
        }
        if (sortQuery === 'total_asc') {
            sort = { total: 1 }; // Giá trị thấp
        }
        if (sortQuery === 'total_desc') {
            sort = { total: -1 }; // Giá trị cao
        }
        // === KẾT THÚC BỔ SUNG ===

        const [orders, totalOrders] = await Promise.all([
            Order.find(where)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(where),
        ]);

        const totalPages = Math.max(1, Math.ceil(totalOrders / limit));
        const pagination = { page, totalPages, totalOrders, limit };

        //check ajax
        if (req.xhr) {
            return res.json({
                ok: true, orders, pagination, filter, filterTitle, q,
                sort: sortQuery, o_status: orderStatus, p_status: paymentStatus // Gửi lại các filter
            });
        }

        // Render HTML nếu tải trang
        render(res, 'orders', {
            title: 'Quản lý Đơn hàng',
            orders, pagination, filter, filterTitle, q,
            sort: sortQuery, o_status: orderStatus, p_status: paymentStatus
        });
    } catch (err) {
        // Bắt lỗi cho cả 2 trường hợp
        if (req.xhr) {
            return res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
        }
        next(err); // Chuyển cho error handler (trang 500)
    }
};

// 2. Hiển thị Chi tiết Đơn hàng (GET /admin/orders/:id)
const getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) {
            req.flash("error", "Không tìm thấy đơn hàng.");
            return res.redirect("/admin/orders");
        }

        // Danh sách trạng thái hợp lệ [cite: 228-230]
        const statuses = [
            "Pending",
            "Confirmed",
            "Shipping",
            "Delivered",
            "Cancelled",
        ];

        render(res, "order-detail", {
            title: `Chi tiết Đơn hàng #${order.code}`,
            order: order,
            statuses: statuses,
        });
    } catch (err) {
        req.flash("error", "ID đơn hàng không hợp lệ.");
        return res.redirect("/admin/orders");
    }
};

// 3. Cập nhật Trạng thái Đơn hàng (POST /admin/orders/:id/status)
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    // Danh sách trạng thái hợp lệ
    const validStatuses = [
        "Pending",
        "Confirmed",
        "Shipping",
        "Delivered",
        "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
        req.flash("error", "Trạng thái không hợp lệ.");
        return res.redirect("back");
    }

    try {
        const order = await Order.findById(id);
        if (!order) {
            req.flash("error", "Không tìm thấy đơn hàng.");
            return res.redirect("/admin/orders");
        }

        // Cập nhật trạng thái và thêm vào lịch sử [cite: 182, 228-230]
        order.status = status;
        order.statusHistory.push({ status: status, updatedAt: new Date() });

        // (Logic nghiệp vụ khi giao hàng thành công)
        if (status === "Delivered") {
            order.paymentStatus = "Paid";
            // (Chúng ta có thể thêm logic cộng điểm/trừ kho ở đây nếu chưa làm)
        }

        await order.save();

        req.flash(
            "success",
            `Cập nhật trạng thái đơn hàng #${order.code} thành công.`
        );
        return res.redirect("back");
    } catch (err) {
        req.flash("error", "Cập nhật thất bại.");
        return res.redirect("back");
    }
};

module.exports = {
    listOrders,
    getOrderDetails,
    updateOrderStatus,
};
