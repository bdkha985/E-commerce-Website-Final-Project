// routes/admin/discounts.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/admin.discount.controller');
const { discountRules } = require('../../middlewares/adminValidator');
const { handleValidation } = require('../../middlewares/authValidator');

// GET /admin/discounts (Danh sách)
router.get('/', ctrl.listDiscounts);

// GET /admin/discounts/new (Hiển thị form)
router.get('/new', ctrl.getDiscountForm);

// POST /admin/discounts/create (Xử lý tạo)
router.post(
    '/create', 
    discountRules, 
    handleValidation, 
    ctrl.createDiscount
);

router.post('/:id/delete', ctrl.deleteDiscount);

module.exports = router;