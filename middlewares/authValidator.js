// middlewares/authValidator.js
const { body, validationResult } = require("express-validator");

// 1. Đăng ký
const signupRules = [
    body("fullName")
        .trim()
        .notEmpty()
        .withMessage("Họ tên là bắt buộc")
        .isLength({ min: 2 })
        .withMessage("Họ tên phải có ít nhất 2 ký tự"),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Email không hợp lệ")
        .normalizeEmail(),
    body("address.street")
        .trim()
        .notEmpty()
        .withMessage("Địa chỉ đường là bắt buộc"),
    body("address.ward").trim().notEmpty().withMessage("Phường/Xã là bắt buộc"),
    body("address.city")
        .trim()
        .notEmpty()
        .withMessage("Tỉnh/Thành phố là bắt buộc"),
];

// 2. Đăng nhập
const signinRules = [
    body("email").trim().isEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

// 3. Quên mật khẩu (Yêu cầu OTP)
const forgotPasswordRules = [
    body("email").trim().isEmail().withMessage("Email không hợp lệ"),
];

// 4. Xác thực OTP
const verifyOtpRules = [
    body("email").trim().isEmail().withMessage("Email không hợp lệ"),
    body("otp").trim().isLength({ min: 4 }).withMessage("Mã OTP không hợp lệ"),
];

// 5. Đặt lại mật khẩu (Reset Password)
const resetPasswordRules = [
    body("email").trim().isEmail().withMessage("Email không hợp lệ"),
    body("resetToken")
        .notEmpty()
        .withMessage("Thiếu mã token đặt lại mật khẩu"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
];

// 6. Đổi mật khẩu bắt buộc (Force Change)
const forceChangePasswordRules = [
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
];

// 7. Đổi mật khẩu chủ động (Trong trang tài khoản)
const changePasswordRules = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Vui lòng nhập mật khẩu hiện tại"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error("Xác nhận mật khẩu không khớp");
        }
        return true;
    }),
];

// 8. Cập nhật hồ sơ (Profile)
const updateProfileRules = [
    body("fullName")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("Tên quá ngắn (tối thiểu 2 ký tự)"),
    body("phone")
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage("Số điện thoại không hợp lệ (10 số bắt đầu bằng 0)"),
    body("email").optional().trim().isEmail().withMessage("Email không hợp lệ"),
];

// 9. Thêm địa chỉ (Address)
const addAddressRules = [
    body("label")
        .trim()
        .notEmpty()
        .withMessage("Tên gợi nhớ (Nhà riêng/Cty) là bắt buộc"),
    body("street").trim().notEmpty().withMessage("Địa chỉ đường là bắt buộc"),
    body("ward").trim().notEmpty().withMessage("Phường/Xã là bắt buộc"),
    body("city").trim().notEmpty().withMessage("Tỉnh/Thành phố là bắt buộc"),
];

const handleApiValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
    }
    next();
};

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

module.exports = {
    signupRules,
    signinRules,
    forgotPasswordRules,
    verifyOtpRules,
    resetPasswordRules,
    forceChangePasswordRules,
    changePasswordRules,
    handleApiValidation,
    handleValidation,
    updateProfileRules,
    addAddressRules,
};
