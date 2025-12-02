// controllers/cart/cart.api.controller.js
const { validationResult } = require("express-validator");
const cartService = require("../../services/cart/cart.service.js");
const Discount = require("../../models/discount.model.js");

// Hàm helper để gửi phản hồi thành công
async function sendSuccessResponse(req, res, cart, message) {
    let discountInfo = null;
    if (req.session.appliedDiscountCode) {
        discountInfo = await Discount.findOne({
            code: req.session.appliedDiscountCode,
        }).lean();
    }
    const totals = cartService.getCartTotals(cart, discountInfo);
    res.status(200).json({
        ok: true,
        message: message,
        ...totals,
    });
}

// POST /api/cart/add
const addToCart = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });
    }
    try {
        const { productId, sku, quantity } = req.body;
        const cart = await cartService.addItemToCart(req, {
            productId,
            sku,
            quantity: parseInt(quantity || 1, 10),
        });
        await sendSuccessResponse(
            req,
            res,
            cart,
            "Thêm vào giỏ hàng thành công!"
        );
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Không thể thêm vào giỏ hàng",
        });
    }
};

// PATCH /api/cart/update/:sku
const updateItem = async (req, res) => {
    try {
        const { sku } = req.params;
        const { quantity } = req.body;
        const newQuantity = parseInt(quantity, 10);
        if (isNaN(newQuantity)) {
            throw new Error("Số lượng không hợp lệ");
        }
        const cart = await cartService.updateItemQuantity(
            req,
            sku,
            newQuantity
        );
        await sendSuccessResponse(
            req,
            res,
            cart,
            "Cập nhật giỏ hàng thành công!"
        );
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Lỗi cập nhật giỏ hàng",
        });
    }
};

// DELETE /api/cart/remove/:sku
const removeItem = async (req, res) => {
    try {
        const { sku } = req.params;
        const cart = await cartService.removeItemFromCart(req, sku);
        await sendSuccessResponse(
            req,
            res,
            cart,
            "Đã xóa sản phẩm khỏi giỏ hàng"
        );
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Lỗi xóa sản phẩm",
        });
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req);
        req.session.appliedDiscountCode = null;
        await sendSuccessResponse(req, res, cart, "Đã xóa toàn bộ giỏ hàng");
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Lỗi xóa giỏ hàng",
        });
    }
};

// HÀM MỚI
const applyDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });
    }
    try {
        const { code } = req.body;
        const discount = await Discount.findOne({
            code: code.toUpperCase(),
        }).lean();
        if (!discount) {
            throw new Error("Mã giảm giá không hợp lệ");
        }
        if (discount.usageCount >= discount.usageLimit) {
            throw new Error("Mã giảm giá đã hết lượt sử dụng");
        }
        const cart = await cartService.getCart(req);
        if (cart.length === 0) {
            throw new Error("Giỏ hàng trống, không thể áp dụng mã");
        }
        req.session.appliedDiscountCode = discount.code;
        await sendSuccessResponse(
            req,
            res,
            cart,
            `Áp dụng mã ${discount.code} thành công!`
        );
    } catch (err) {
        req.session.appliedDiscountCode = null;
        res.status(400).json({
            ok: false,
            message: err.message || "Lỗi áp dụng mã",
        });
    }
};

// HÀM MỚI
const getCartItems = async (req, res) => {
    try {
        const cart = await cartService.getCart(req);
        await sendSuccessResponse(req, res, cart, "Lấy giỏ hàng thành công");
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Lỗi lấy giỏ hàng",
        });
    }
};

module.exports = {
    addToCart,
    updateItem,
    removeItem,
    clearCart,
    applyDiscount,
    getCartItems,
};
