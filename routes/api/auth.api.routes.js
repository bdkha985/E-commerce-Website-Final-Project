// routes/auth.api.js
const express = require("express");
const { body } = require("express-validator");
const { apiSignin, apiSignup } = require("../../controllers/auth/authApiController");
const { forceChangePassword } = require("../../controllers/auth/forceChangePasswordController")
const { signupRules, signinRules, handleApiValidation } = require("../../middlewares/authValidator");

const router = express.Router();

router.post("/signup", signupRules, handleApiValidation, apiSignup);
router.post("/signin", signinRules, handleApiValidation, apiSignin);

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