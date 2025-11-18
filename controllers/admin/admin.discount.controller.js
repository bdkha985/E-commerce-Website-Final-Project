// controllers/admin/admin.discount.controller.js
const Discount = require('../../models/discount.model');
const crypto = require('crypto');

function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`,
        ...data,
    });
}

// 1. Hiển thị Danh sách Mã (GET /admin/discounts)
const listDiscounts = async (req, res, next) => {
    try {
        const discounts = await Discount.find()
            .populate('orderIds', 'code total') // Lấy thông tin cơ bản của đơn hàng
            .sort({ createdAt: -1 })
            .lean();

        render(res, 'discounts', {
            title: 'Quản lý giảm giá',
            discounts: discounts
        });
    } catch (err) {
        next(err);
    }
};

// 2. Hiển thị Form Tạo mới (GET /admin/discounts/new)
const getDiscountForm = (req, res) => {
    render(res, 'discount-form', {
        title: 'Tạo mã giảm giá mới'
    });
};

// 3. Xử lý Tạo mới (POST /admin/discounts/create)
const createDiscount = async (req, res) => {
    let { code, discountValue, usageLimit } = req.body;

    // 1. Kiểm tra giá trị
    discountValue = parseFloat(discountValue);
    usageLimit = parseInt(usageLimit, 10);
    if (isNaN(discountValue) || discountValue <= 0) {
        req.flash('error', 'Giá trị giảm phải là một số dương.');
        return res.redirect('/admin/discounts/new');
    }
    if (isNaN(usageLimit) || usageLimit <= 0 || usageLimit > 10) {
        req.flash('error', 'Giới hạn sử dụng phải từ 1 đến 10.');
        return res.redirect('/admin/discounts/new');
    }

    // 2. Xử lý Mã (code)
    if (!code) {
        // Tự động tạo mã 5 ký tự nếu để trống
        code = crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase();
    } else {
        // Kiểm tra mã admin nhập
        if (code.length !== 5 || !/^[A-Z0-9]+$/.test(code.toUpperCase())) {
            req.flash('error', 'Mã phải là 5 ký tự (chỉ chữ hoặc số).');
            return res.redirect('/admin/discounts/new');
        }
        code = code.toUpperCase();
    }
    
    // 3. Kiểm tra trùng
    try {
        const existing = await Discount.findOne({ code: code });
        if (existing) {
            req.flash('error', `Mã "${code}" đã tồn tại. Hãy thử mã khác.`);
            return res.redirect('/admin/discounts/new');
        }

        // 4. Tạo mới
        await Discount.create({
            code: code,
            discountValue: discountValue,
            usageLimit: usageLimit
        });

        req.flash('success', `Đã tạo mã "${code}" thành công.`);
        res.redirect('/admin/discounts');

    } catch (err) {
        req.flash('error', 'Lỗi khi tạo mã: ' + err.message);
        res.redirect('/admin/discounts/new');
    }
};

const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        await Discount.findByIdAndDelete(id);
        req.flash('success', 'Đã xóa mã giảm giá thành công.');
    } catch (err) {
        console.error("Lỗi xóa discount:", err);
        req.flash('error', 'Lỗi khi xóa mã: ' + err.message);
    }
    res.redirect('/admin/discounts');
};

module.exports = {
    listDiscounts,
    getDiscountForm,
    createDiscount,
    deleteDiscount
};