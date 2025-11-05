// controllers/authApiController.js

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const {
    findUserByEmail,
    validatePassword,
    createUserAndSendPassword
} = require("../services/user.service");

// ĐĂNG KÝ
const apiSignup = async (req, res) => {
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

    const { email, fullName, address } = req.body;

    try {
        const user = await createUserAndSendPassword({
            email,
            fullName,
            address
        });

        // req.session.userId = user._id.toString();
        // req.session.fullName = user.fullName;
        // req.session.role = "customer";

        req.flash("success", "Đăng kí thành công");
        return res.status(201).json({
            ok: true,
            message: "Đăng ký thành công, Vui lòng kiểm tra email để nhận mật khẩu tạm thời.",
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
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

    if (user.mustChangePassword) {
        req.session.tempUserId = user._id.toString();
        req.session.tempUserEmail = user.email;

        return res.status(200).json({
            ok: true,
            forcePasswordChange: true,
            message: "Đăng nhập thành công. Vui lòng đổi mật khẩu.",
        });
    }
    
req.login(user, (err) => {
        if (err) {
            console.error("Lỗi req.login:", err);
            return res.status(500).json({ ok: false, message: "Lỗi khi tạo phiên đăng nhập." });
        }

        // Sau khi login thành công, req.user đã được thiết lập
        
        // (Chúng ta vẫn gán session phụ cho middleware app.js)
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
    });
};

module.exports = { apiSignin, apiSignup };
