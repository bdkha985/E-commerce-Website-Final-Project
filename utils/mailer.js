// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: +(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
        user: process.env.SMTP_USER, // your-email@gmail.com
        pass: process.env.SMTP_PASS, // App Password (Gmail cần app password 16 ký tự)
    },
});

// Kiểm tra cấu hình SMTP khi server start (chỉ log, không throw)
(async () => {
    try {
        await transporter.verify();
        console.log("✅ SMTP verified");
    } catch (e) {
        console.error("❌ SMTP verify failed:", e.message);
    }
})();

async function sendOtpEmail(to, otp, expiresAt) {
    const html = `
    <p>Xin chào,</p>
    <p>Mã xác thực (OTP) của bạn là: <b style="font-size:1.6rem">${otp}</b></p>
    <p>Mã có hiệu lực đến: <b>${new Date(expiresAt).toLocaleString()}</b></p>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
  `;
    return transporter.sendMail({
        from: `"K Shopping" <${process.env.SMTP_USER}>`,
        to,
        subject: "Mã OTP khôi phục mật khẩu",
        html,
    });
}

module.exports = { sendOtpEmail };
