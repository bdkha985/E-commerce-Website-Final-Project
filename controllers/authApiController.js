// controllers/authApiController.js
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const {
    createUserLocal,
    findUserByEmail,
    validatePassword,
} = require("../services/user.service");

// ĐĂNG KÝ (API JSON)
const apiSignup = async (req, res) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: errors
                .array()
                .map((e) => e.msg)
                .join(", "),
        });
    }

    const { email, password, fullName, phone } = req.body;

    try {
        const user = await createUserLocal({
            email,
            password,
            fullName,
            phone,
        });

        // set session ngay sau khi đăng ký
        req.session.userId = user._id.toString();
        req.session.fullName = user.fullName;
        req.session.role = "customer";

        req.flash("success", "Đăng kí thành công");
        return res.status(201).json({
            ok: true,
            message: "Đăng ký thành công",
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                roles: user.roles,
            },
        });
    } catch (err) {
        return res
            .status(400)
            .json({ ok: false, message: err.message || "Đăng ký thất bại" });
    }
};

const apiSignin = async (req, res) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: errors
                .array()
                .map((e) => e.msg)
                .join(", "),
        });
    }

    const { email, password } = req.body || {};
    const user = await findUserByEmail(email);

    if (!user) {
        return res
            .status(401)
            .json({ ok: false, message: "Email hoặc mật khẩu sai" });
    }

    const ok = await validatePassword(user, password);
    if (!ok) {
        return res
            .status(401)
            .json({ ok: false, message: "Email hoặc mật khẩu sai" });
    }

    // set session cho web
    req.session.userId = user._id.toString();
    req.session.fullName = user.fullName;
    req.session.role = (user.roles || []).includes("admin")
        ? "admin"
        : "customer";
    req.session.avatarUrl = user.avatarUrl || "";

    req.flash("success", "Đăng nhập thành công");
    return res.status(200).json({
        ok: true,
        message: "Đăng nhập thành công",
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            roles: user.roles,
        },
    });
};

module.exports = { apiSignin, apiSignup };
