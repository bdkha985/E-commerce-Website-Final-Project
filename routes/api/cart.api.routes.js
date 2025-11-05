// routes/cart.api.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartApiController = require('../../controllers/cart/cart.api.controller');

// POST /api/cart/add
router.post(
    '/add',
    [
        body('productId').notEmpty().withMessage('Thiếu ID sản phẩm'),
        body('sku').notEmpty().withMessage('Thiếu SKU biến thể'),
        body('quantity').isInt({ min: 1 }).withMessage('Số lượng không hợp lệ')
    ],
    cartApiController.addToCart
);

// PATCH /api/cart/update/:sku
router.patch(
    '/update/:sku',
    [ body('quantity').isInt().withMessage('Số lượng không hợp lệ') ],
    cartApiController.updateItem
);

// DELETE /api/cart/remove/:sku
router.delete(
    '/remove/:sku',
    cartApiController.removeItem
);

// DELETE /api/cart/clear
router.delete(
    '/clear',
    cartApiController.clearCart
);

module.exports = router;