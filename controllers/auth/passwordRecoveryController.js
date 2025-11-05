// controllers/passwordRecoveryController.js

const { body, validationResult } = require("express-validator");
const {
    createResetRequest,
    verifyOtp,
    resetPassword,
} = require("../../services/auth/passwordReset.service");

// POST /api/auth/forgot
async function forgot(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });

    const { email } = req.body;
    await createResetRequest(email, req.ip);
    res.json({ ok: true, message: "Nếu email tồn tại, mã OTP đã được gửi" });
}

// POST /api/auth/verify-otp
async function verify(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });

    const { email, otp } = req.body;
    const r = await verifyOtp(email, otp);
    if (!r.ok) return res.status(400).json(r);
    res.json({ ok: true, resetToken: r.resetToken, email: r.email });
}

// POST /api/auth/reset-password
async function reset(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });

    const { email, resetToken, newPassword } = req.body;
    const r = await resetPassword(email, resetToken, newPassword);
    if (!r.ok) return res.status(400).json(r);
    res.json({ ok: true, message: "Đặt mật khẩu mới thành công" });
}

module.exports = { forgot, verify, reset };
