//controllers/accountApiController.js

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/user.model");
const Order = require('../../models/order.model');

// Helper get id
function getUserId(req) {
    return req.user?._id || req.session?.userId;
}

const getMe = async (req, res) => {
    const id = getUserId(req);
    const user = await User.findById(id).lean();
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy user",
        });

    const { _id, email, fullName, phone, roles, loyaltyPoints, addresses } =
        user;
    res.json({
        ok: true,
        user: { _id, email, fullName, phone, roles, loyaltyPoints, addresses },
    });
};

const updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({
            ok: false,
            message: errors.array()[0].msg,
        });

    const id = getUserId(req);
    const { fullName, phone, avatarUrl } = req.body;

    const toSet = {};
    if (fullName !== undefined) toSet.fullName = fullName;
    if (phone !== undefined) toSet.phone = phone;
    if (avatarUrl !== undefined) toSet.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
        id,
        { $set: toSet },
        { new: true }
    );
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy user",
        });

    res.json({
        ok: true,
        message: "Cập nhật thành công",
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
        },
    });
};

const changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({
            ok: false,
            message: errors.array()[0].msg,
        });

    const id = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy user",
        });

    if (!user.passwordHash) {
        return res.status(400).json({
            ok: false,
            message: "Tài khoản mạng xã hội không thể đổi mật khẩu tại đây",
        });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok)
        return res.status(400).json({
            ok: false,
            message: "Mật khẩu hiện tại không đúng",
        });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ ok: true, message: "Đổi mật khẩu thành công" });
};

// ============ Addresses =================
const listAddresses = async (req, res) => {
    const id = getUserId(req);
    const user = await User.findById(id).lean();
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy user",
        });
    res.json({ ok: true, addresses: user.addresses || [] });
};

const addAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({
            ok: false,
            message: errors.array()[0].msg,
        });

    const id = getUserId(req);
    const { label, street, ward, city, isDefault } = req.body;

    const user = await User.findById(id);
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy user",
        });

    const newAddr = {
        label,
        street,
        ward,
        city,
        isDefault: !!isDefault,
    };

    if (newAddr.isDefault && Array.isArray(user.addresses)) {
        user.addresses = user.addresses.map((a) => ({
            ...a,
            isDefault: false,
        }));
    }

    user.addresses.push(newAddr);
    await user.save();
    res.json({
        ok: true,
        messsage: "Thêm địa chỉ thành công",
        addresses: user.addresses,
    });
};

const updateAddressByIndex = async (req, res) => {
    const id = getUserId(req);
    const idx = parseInt(req.params.idx, 10);

    const user = await User.findById(id);
    if (!user)
        return res
            .status(404)
            .json({ ok: false, message: "Không tìm thấy người dùng" });

    if (
        !Array.isArray(user.addresses) ||
        idx < 0 ||
        idx >= user.addresses.length
    ) {
        return res
            .status(400)
            .json({ ok: false, message: "Chỉ số địa chỉ không hợp lệ" });
    }

    const patch = req.body || {};

    if (patch.isDefault === true) {
        // đặt mặc định địa chỉ idx, các địa chỉ khác false
        user.addresses = user.addresses.map((a, i) => {
            const base = a?.toObject ? a.toObject() : a;
            return { ...base, isDefault: i === idx };
        });
    } else {
        const cur = user.addresses[idx];
        const base = cur?.toObject ? cur.toObject() : cur;
        user.addresses[idx] = { ...base, ...patch };
    }

    await user.save();
    return res.json({
        ok: true,
        message: "Cập nhật địa chỉ thành công",
        addresses: user.addresses,
    });
};

const removeAddressByIndex = async (req, res) => {
    const id = getUserId(req);
    const idx = parseInt(req.params.idx, 10);

    const user = await User.findById(id);
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy người dùng",
        });

    if (
        !Array.isArray(user.addresses) ||
        idx < 0 ||
        idx >= user.addresses.length
    )
        return res.status(400).json({
            ok: false,
            message: "Chỉ số địa chỉ không hợp lệ",
        });

    user.addresses.splice(idx, 1);
    await user.save();
    res.json({
        ok: true,
        message: "Xóa địa chỉ thành công",
        addresses: user.addresses,
    });
};

const setDefaultAddressByIndex = async (req, res) => {
    const id = getUserId(req);
    const idx = parseInt(req.params.idx, 10);

    const user = await User.findById(id);
    if (!user)
        return res.status(404).json({
            ok: false,
            message: "Không tìm thấy người dùng",
        });

    if (
        !Array.isArray(user.addresses) ||
        idx < 0 ||
        idx >= user.addresses.length
    )
        return res.status(400).json({
            ok: false,
            message: "Chỉ số dịa chỉ không hợp lệ",
        });

    user.addresses = user.addresses.map((a, i) => ({
        ...(a.toObject?.() ?? a),
        isDefault: i === idx,
    }));
    await user.save();
    res.json({
        ok: true,
        message: "Đặt lại địa chỉ mặc định thành công",
        addresses: user.addresses,
    });
};

// GET /api/account/orders
const getOrderHistory = async (req, res) => {
    const id = getUserId(req);
    // Sắp xếp theo ngày tạo mới nhất
    const orders = await Order.find({ userId: id })
        .sort({ createdAt: -1 })
        .select('code createdAt total status paymentMethod') // Chỉ lấy các trường cần
        .lean();
    
    res.json({ ok: true, orders });
};

// GET /api/account/orders/:code
const getOrderDetail = async (req, res) => {
    const id = getUserId(req);
    const { code } = req.params;

    const order = await Order.findOne({ userId: id, code: code }).lean();
    
    if (!order) {
        return res.status(404).json({ ok: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ ok: true, order });
};

module.exports = {
    getMe,
    updateProfile,
    changePassword,
    listAddresses,
    addAddress,
    updateAddressByIndex,
    removeAddressByIndex,
    setDefaultAddressByIndex,
    getOrderHistory,
    getOrderDetail,
    
};
