// middlewares/adminValidator.js
const { body } = require("express-validator");

// 1. Validate sản phẩm
const productRules = [
    body("name").trim().notEmpty().withMessage("Tên sản phẩm không được để trống"),
    body("basePrice")
        .isFloat({ min: 0 })
        .withMessage("Giá cơ bản phải là số dương"),
    body("shortDesc").trim().notEmpty().withMessage("Mô tả ngắn không được để trống"),
    body("brandId").notEmpty().withMessage("Vui lòng chọn thương hiệu"),
    // Kiểm tra biến thể (nếu có)
    body("sku.*").optional().trim().notEmpty().withMessage("SKU không được để trống"),
    body("price.*").optional().isFloat({ min: 0 }).withMessage("Giá biến thể không hợp lệ"),
    body("stock.*").optional().isInt({ min: 0 }).withMessage("Tồn kho không hợp lệ"),
];

// 2. Validate Mã giảm giá
const discountRules = [
    body("code")
        .trim()
        .toUpperCase()
        .notEmpty().withMessage("Mã giảm giá không được để trống")
        .isLength({ min: 5, max: 5 }).withMessage("Mã phải đúng 5 ký tự")
        .matches(/^[A-Z0-9]+$/).withMessage("Mã chỉ được chứa chữ cái và số"),
    body("discountValue")
        .isFloat({ min: 1000 })
        .withMessage("Giá trị giảm tối thiểu là 1.000đ"),
    body("usageLimit")
        .isInt({ min: 1, max: 10 })
        .withMessage("Giới hạn sử dụng phải từ 1 đến 10"),
];

// 3. Validate Cập nhật User (Admin sửa)
const userUpdateRules = [
    body("fullName").trim().notEmpty().withMessage("Họ tên không được để trống"),
    body("phone")
        .trim()
        .optional({ checkFalsy: true }) // Cho phép rỗng
        .matches(/^0\d{9}$/).withMessage("Số điện thoại không hợp lệ"),
];

// 4. Validate Cập nhật Trạng thái Đơn hàng
const orderStatusRules = [
    body("status")
        .isIn(['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'])
        .withMessage("Trạng thái đơn hàng không hợp lệ"),
];

module.exports = {
    productRules,
    discountRules,
    userUpdateRules,
    orderStatusRules
};