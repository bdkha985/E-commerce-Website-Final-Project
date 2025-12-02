// routes/admin/products.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/admin.product.controller");
const upload = require("../../middlewares/upload");

// Import Validator
const { productRules } = require("../../middlewares/adminValidator");
const { handleValidation } = require("../../middlewares/authValidator");

// GET /admin/products (Danh sách sản phẩm)
router.get("/", ctrl.listProducts);

// GET /admin/products/new (Hiển thị form thêm mới)
router.get("/new", ctrl.getProductForm);

// GET /admin/products/:id (Hiển thị form sửa)
router.get("/:id", ctrl.getProductForm);

// POST /admin/products/save (Xử lý lưu - cả thêm mới và cập nhật)
router.post(
    "/save",
    upload.array("images", 5),
    productRules,
    handleValidation,
    ctrl.saveProduct
);

// POST /admin/products/:id/delete (Xử lý xóa)
router.post("/:id/delete", ctrl.deleteProduct);

module.exports = router;
