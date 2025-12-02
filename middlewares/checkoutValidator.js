// middlewares/checkoutValidator.js
const { body } = require("express-validator");

const placeOrderRules = [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("fullName")
        .trim()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Họ tên là bắt buộc và tối thiểu là 2 kí tự."),
    body("phone")
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)"),
    body("street")
        .trim()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Địa chỉ là bắt buộc và tối thiểu là 2 kí tự"),
    body("ward")
        .trim()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Phường/Xã là bắt buộc và tối thiểu là 2 kí tự"),
    body("city")
        .trim()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Tỉnh/Thành phố là bắt buộc và tối thiểu là 2 kí tự"),
];

module.exports = {
    placeOrderRules,
};
