// routes/auth.api.js
const express = require("express");
const { body } = require("express-validator");
const { apiSignin, apiSignup } = require("../../controllers/auth/auth.api.controller");
const { forceChangePassword } = require("../../controllers/auth/forceChangePassword.controller")
const { signupRules, signinRules, handleApiValidation } = require("../../middlewares/authValidator");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", signupRules, handleApiValidation, apiSignup);
// POST /api/auth/signin
router.post("/signin", signinRules, handleApiValidation, apiSignin);

// POST /api/auth/force-change-password
router.post(
    "/force-change-password",
    [
        body("newPassword")
            .isLength({ min: 6 }).withMessage("Mật khẩu mới phải ít nhất 6 ký tự"),
    ],
    handleApiValidation,
    forceChangePassword
);

module.exports = router;