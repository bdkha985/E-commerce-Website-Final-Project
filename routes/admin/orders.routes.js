// routes/admin/orders.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/admin.order.controller');

// GET /admin/orders (Hiển thị danh sách, có lọc)
router.get('/', ctrl.listOrders);

// GET /admin/orders/:id (Hiển thị chi tiết 1 đơn hàng)
router.get('/:id', ctrl.getOrderDetails);

// POST /admin/orders/:id/status (Cập nhật trạng thái)
router.post('/:id/status', ctrl.updateOrderStatus);

module.exports = router;