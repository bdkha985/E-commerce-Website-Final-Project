// controllers/authController.js
const { validationResult } = require("express-validator");
const {
    createUserLocal,
    findUserByEmail,
    validatePassword,
} = require("../services/user.service");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const signup = async (req, res) => {
    const { email, password, fullName } = req.body;
    try {
        const user = await createUserLocal({ email, password, fullName });

        // set session login luôn
        req.session.userId = user._id;
        req.session.fullName = user.fullName;
        req.session.role = "customer";

        req.flash("success", "Đăng ký thành công 🎉");
        return res.redirect("/homepage");
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect("/signup");
    }
};

const signin = async (req, res, next) => {
    try {
        const { email, password, remember } = req.body;

        const user = await findUserByEmail(email);
        const ok = await validatePassword(user, password);

        if (!ok) {
            req.flash("error", "Email hoặc mật khẩu sai");
            return res.redirect("/signin");
        }

        // Lưu session
        req.session.userId = user._id.toString();
        req.session.fullName = user.fullName;
        req.session.role = (user.roles || []).includes("admin")
            ? "admin"
            : "customer";

        // Remember me (tùy chọn)
        if (remember) req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 ngày

        req.flash("success", "Đăng nhập thành công");
        return res.redirect("/homepage");
    } catch (err) {
        next(err);
    }
};

module.exports = { signup, signin };
