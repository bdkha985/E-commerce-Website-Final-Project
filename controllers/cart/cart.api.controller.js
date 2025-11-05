// controllers/cartApiController.js
const { validationResult } = require("express-validator");
const cartService = require('../../services/cart/cart.service.js');

// Hàm helper để gửi phản hồi thành công (tránh lặp code)
function sendSuccessResponse(res, cart, message) {
    const totals = cartService.getCartTotals(cart);
    res.status(200).json({
        ok: true,
        message: message,
        ...totals // Gửi về subtotal, total, tax, shippingFee, totalItems, cart
    });
}

// POST /api/cart/add
const addToCart = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ ok: false, message: errors.array()[0].msg });
    }
    try {
        const { productId, sku, quantity } = req.body;
        const cart = await cartService.addItemToCart(req, {
            productId,
            sku,
            quantity: parseInt(quantity || 1, 10)
        });
        sendSuccessResponse(res, cart, "Thêm vào giỏ hàng thành công!");
    } catch (err) {
        res.status(400).json({ ok: false, message: err.message || "Không thể thêm vào giỏ hàng" });
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

        const cart = await cartService.updateItemQuantity(req, sku, newQuantity);
        sendSuccessResponse(res, cart, "Cập nhật giỏ hàng thành công!");

    } catch (err) {
        res.status(400).json({ ok: false, message: err.message || "Lỗi cập nhật giỏ hàng" });
    }
};

// DELETE /api/cart/remove/:sku
const removeItem = async (req, res) => {
    try {
        const { sku } = req.params;
        const cart = await cartService.removeItemFromCart(req, sku);
        sendSuccessResponse(res, cart, "Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err) {
        res.status(400).json({ ok: false, message: err.message || "Lỗi xóa sản phẩm" });
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req);
        sendSuccessResponse(res, cart, "Đã xóa toàn bộ giỏ hàng");
    } catch (err) {
        res.status(400).json({ ok: false, message: err.message || "Lỗi xóa giỏ hàng" });
    }
};

module.exports = {
    addToCart,
    updateItem, // <-- THÊM VÀO
    removeItem, // <-- THÊM VÀO
    clearCart,  // <-- THÊM VÀO
};