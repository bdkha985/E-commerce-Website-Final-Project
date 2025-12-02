// services/passwordReset.service.js

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../../models/user.model");
const PasswordReset = require("../../models/passwordReset.model");
const { sendOtpEmail } = require("../../utils/mailer");

// Cấu hình OTP và token
const OTP_LENGTH = +(process.env.OTP_LENGTH || 6);
const OTP_EXPIRES_MIN = +(process.env.OTP_EXPIRES_MIN || 10);
const RESET_TOKEN_EXPIRES_MIN = +(process.env.RESET_TOKEN_EXPIRES_MIN || 5);

// Sinh OTP ngẫu nhiên
function genOtp(len = OTP_LENGTH) {
    return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(
        len,
        "0"
    );
}

// Hash OTP bằng sha256
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

// Tạo yêu cầu reset password, gửi OTP tới email
async function createResetRequest(email, clientIp) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const user = await User.findOne({ email: mail });
    if (!user) return { ok: true };

    const otp = genOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

    // Xóa các yêu cầu reset cũ
    await PasswordReset.deleteMany({ userId: user._id });

    // Tạo record mới cho OTP
    await PasswordReset.create({
        userId: user._id,
        email: user.email,
        otpHash,
        expiresAt,
        attempts: 0,
    });

    // Gửi OTP qua email
    await sendOtpEmail(user.email, otp, expiresAt);
    return { ok: true };
}

// Xác thực OTP
async function verifyOtp(email, otp) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const pr = await PasswordReset.findOne({ email: mail }).sort({
        createdAt: -1,
    });
    if (!pr) return { ok: false, message: "OTP không hợp lệ" };

    // Kiểm tra thời hạn OTP
    if (Date.now() > new Date(pr.expiresAt).getTime()) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return { ok: false, message: "OTP đã hết hạn" };
    }

    // Kiểm tra số lần thử
    if ((pr.attempts || 0) >= 3) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return {
            ok: false,
            message: "Bạn đã thử quá số lần cho phép, vui lòng yêu cầu lại",
        };
    }

    // Kiểm tra OTP
    if (hashOtp(otp) !== pr.otpHash) {
        await PasswordReset.updateOne(
            { _id: pr._id },
            { $inc: { attempts: 1 } }
        );
        return { ok: false, message: "OTP không đúng" };
    }

    // Tạo reset token thay cho OTP
    const resetToken = crypto.randomBytes(24).toString("hex");
    const resetTokenExpiresAt = new Date(
        Date.now() + RESET_TOKEN_EXPIRES_MIN * 60 * 1000
    );
    await PasswordReset.updateOne(
        { _id: pr._id },
        { $set: { resetToken, resetTokenExpiresAt }, $unset: { otpHash: "" } }
    );

    return { ok: true, resetToken, email: pr.email };
}

// Thực hiện reset password
async function resetPassword(email, resetToken, newPassword) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const pr = await PasswordReset.findOne({ email: mail }).sort({
        createdAt: -1,
    });

    // Kiểm tra token hợp lệ
    if (!pr || !pr.resetToken)
        return { ok: false, message: "Token không hợp lệ" };
    if (pr.resetToken !== resetToken)
        return { ok: false, message: "Token không đúng" };
    if (Date.now() > new Date(pr.resetTokenExpiresAt).getTime()) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return { ok: false, message: "Token đã hết hạn" };
    }

    // Tìm user và cập nhật password mới
    const user = await User.findOne({ email: mail });
    if (!user) return { ok: false, message: "Không tìm thấy user" };

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Xóa các record reset password cũ
    await PasswordReset.deleteMany({ userId: user._id });

    return { ok: true };
}

module.exports = { createResetRequest, verifyOtp, resetPassword };
