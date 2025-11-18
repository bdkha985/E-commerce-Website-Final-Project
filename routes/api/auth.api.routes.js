// routes/auth.api.js
const express = require("express");
const {
    apiSignin,
    apiSignup,
} = require("../../controllers/auth/auth.api.controller");
const {
    forceChangePassword,
} = require("../../controllers/auth/forceChangePassword.controller");
const {
    signupRules,
    signinRules,
    forceChangePasswordRules,
    handleApiValidation,
} = require("../../middlewares/authValidator");

const router = express.Router();

router.post("/signup", signupRules, handleApiValidation, apiSignup);
router.post("/signin", signinRules, handleApiValidation, apiSignin);

// Đổi mật khẩu bắt buộc
router.post(
    "/force-change-password",
    forceChangePasswordRules, // Sử dụng rule đã tách ra
    handleApiValidation,
    forceChangePassword
);

module.exports = router;
