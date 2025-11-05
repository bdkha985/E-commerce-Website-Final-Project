// routes/passwordRecovery.api.js
const express = require("express");
const { body } = require("express-validator");
const ctrl = require("../../controllers/auth/passwordRecoveryController");

const router = express.Router();

router.post(
    "/forgot",
    [body("email").isEmail().withMessage("Email không hợp lệ")],
    ctrl.forgot
);

router.post(
    "/verify-otp",
    [
        body("email").isEmail().withMessage("Email không hợp lệ"),
        body("otp").isLength({ min: 4 }).withMessage("OTP không hợp lệ"),
    ],
    ctrl.verify
);

router.post(
    "/reset-password",
    [
        body("email").isEmail().withMessage("Email không hợp lệ"),
        body("resetToken").notEmpty().withMessage("Thiếu reset token"),
        body("newPassword")
            .isLength({ min: 6 })
            .withMessage("Mật khẩu >= 6 ký tự"),
    ],
    ctrl.reset
);

module.exports = router;
