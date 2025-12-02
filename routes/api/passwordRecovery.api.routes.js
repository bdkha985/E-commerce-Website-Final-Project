// routes/passwordRecovery.api.js
const express = require("express");
const ctrl = require("../../controllers/auth/password.api.controller");
const {
    forgotPasswordRules,
    verifyOtpRules,
    resetPasswordRules,
    handleApiValidation,
} = require("../../middlewares/authValidator");

const router = express.Router();

// Quên mật khẩu
router.post("/forgot", forgotPasswordRules, handleApiValidation, ctrl.forgot);

// Xác thực OTP
router.post("/verify-otp", verifyOtpRules, handleApiValidation, ctrl.verify);

// Đặt lại mật khẩu
router.post(
    "/reset-password",
    resetPasswordRules,
    handleApiValidation,
    ctrl.reset
);

module.exports = router;
