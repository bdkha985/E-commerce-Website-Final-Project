// routes/admin/products.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/admin.product.controller');

// GET /admin/products (Danh sách sản phẩm)
router.get('/', ctrl.listProducts);

// GET /admin/products/new (Hiển thị form thêm mới)
// (Phải đặt trước /:id để "new" không bị nhầm là 1 ID)
router.get('/new', ctrl.getProductForm);

// GET /admin/products/:id (Hiển thị form sửa)
router.get('/:id', ctrl.getProductForm);

// POST /admin/products/save (Xử lý lưu - cả thêm mới và cập nhật)
router.post('/save', ctrl.saveProduct);

// POST /admin/products/:id/delete (Xử lý xóa)
router.post('/:id/delete', ctrl.deleteProduct);

module.exports = router;