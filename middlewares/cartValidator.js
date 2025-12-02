// middlewares/cartValidator.js
const { body } = require("express-validator");

// 1. Thêm vào giỏ
const addToCartRules = [
    body("productId").trim().notEmpty().withMessage("Thiếu ID sản phẩm"),
    body("sku").trim().notEmpty().withMessage("Thiếu SKU biến thể"),
    body("quantity")
        .isInt({ min: 1 })
        .withMessage("Số lượng phải là số nguyên dương lớn hơn 0"),
];

// 2. Cập nhật số lượng
const updateCartItemRules = [
    body("quantity").isInt().withMessage("Số lượng phải là số nguyên"),
];

// 3. Áp dụng mã giảm giá
const applyDiscountRules = [
    body("code").trim().notEmpty().withMessage("Vui lòng nhập mã giảm giá"),
];

module.exports = {
    addToCartRules,
    updateCartItemRules,
    applyDiscountRules,
};
