// routes/api/checkout.api.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const checkoutApiController = require('../../controllers/checkout/checkout.api.controller');

// POST /api/checkout
router.post(
    '/',
    [
        body('email').isEmail().withMessage('Email không hợp lệ'),
        body('fullName').notEmpty().withMessage('Họ tên là bắt buộc'),
        body('phone').matches(/^0\d{9,10}$/).withMessage('SĐT không hợp lệ'),
        body('street').notEmpty().withMessage('Địa chỉ là bắt buộc'),
        body('ward').notEmpty().withMessage('Phường/Xã là bắt buộc'),
        body('city').notEmpty().withMessage('Tỉnh/Thành phố là bắt buộc'),
    ],
    checkoutApiController.placeOrder
);

// GET /api/checkout/vnpay_return
router.get('/vnpay_return', (req, res) => {
    // (Chúng ta sẽ code logic này ở bước sau)
    res.send("ĐANG XỬ LÝ VNPAY... (Sẽ làm ở bước sau)");
});
module.exports = router;