// services/passwordReset.service.js
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../../models/user.model");
const PasswordReset = require("../../models/passwordReset.model");
const { sendOtpEmail } = require("../../utils/mailer");

const OTP_LENGTH = +(process.env.OTP_LENGTH || 6);
const OTP_EXPIRES_MIN = +(process.env.OTP_EXPIRES_MIN || 10);
const RESET_TOKEN_EXPIRES_MIN = +(process.env.RESET_TOKEN_EXPIRES_MIN || 5);

function genOtp(len = OTP_LENGTH) {
    return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(
        len,
        "0"
    );
}
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

async function createResetRequest(email, clientIp) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const user = await User.findOne({ email: mail });
    if (!user) return { ok: true };

    const otp = genOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

    await PasswordReset.deleteMany({ userId: user._id });

    await PasswordReset.create({
        userId: user._id,
        email: user.email,
        otpHash,
        expiresAt,
        attempts: 0,
    });

    // Gửi mail
    await sendOtpEmail(user.email, otp, expiresAt);
    return { ok: true };
}

async function verifyOtp(email, otp) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const pr = await PasswordReset.findOne({ email: mail }).sort({
        createdAt: -1,
    });
    if (!pr) return { ok: false, message: "OTP không hợp lệ" };

    if (Date.now() > new Date(pr.expiresAt).getTime()) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return { ok: false, message: "OTP đã hết hạn" };
    }

    if ((pr.attempts || 0) >= 3) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return {
            ok: false,
            message: "Bạn đã thử quá số lần cho phép, vui lòng yêu cầu lại",
        };
    }

    if (hashOtp(otp) !== pr.otpHash) {
        await PasswordReset.updateOne(
            { _id: pr._id },
            { $inc: { attempts: 1 } }
        );
        return { ok: false, message: "OTP không đúng" };
    }

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

async function resetPassword(email, resetToken, newPassword) {
    const mail = String(email || "")
        .toLowerCase()
        .trim();
    const pr = await PasswordReset.findOne({ email: mail }).sort({
        createdAt: -1,
    });
    if (!pr || !pr.resetToken)
        return { ok: false, message: "Token không hợp lệ" };
    if (pr.resetToken !== resetToken)
        return { ok: false, message: "Token không đúng" };
    if (Date.now() > new Date(pr.resetTokenExpiresAt).getTime()) {
        await PasswordReset.deleteOne({ _id: pr._id });
        return { ok: false, message: "Token đã hết hạn" };
    }

    const user = await User.findOne({ email: mail });
    if (!user) return { ok: false, message: "Không tìm thấy user" };

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await PasswordReset.deleteMany({ userId: user._id });

    return { ok: true };
}

module.exports = { createResetRequest, verifyOtp, resetPassword };
