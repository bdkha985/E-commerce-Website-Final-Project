//middlewares/authValidator.js

const { body, validationResult } = require("express-validator");

const signupRules = [
    body("fullName")
        .trim()
        .notEmpty()
        .withMessage("Họ tên bắt buộc")
        .isLength({ min: 2 })
        .withMessage("Họ tên ít nhất 2 ký tự"),

    body("email").isEmail().withMessage("Email không hợp lệ"),

    body("address.street")
            .trim()
            .notEmpty().withMessage("Địa chỉ đường không được trống"),
        body("address.ward")
            .trim()
            .notEmpty().withMessage("Phường/Xã không được trống"),
        body("address.city")
            .trim()
            .notEmpty().withMessage("Tỉnh/Thành phố không được trống"),
];

const signinRules = [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msg = errors
            .array()
            .map((e) => e.msg)
            .join(", ");
        req.flash("error", msg);
        return res.redirect("back");
    }
    next();
};

const handleApiValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: errors.array().map((e) => e.msg).join(", "),
        });
    }
    next();
};

module.exports = { signupRules, signinRules, handleValidation, handleApiValidation };
