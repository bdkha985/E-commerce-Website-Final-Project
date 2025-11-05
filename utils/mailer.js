// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: +(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

(async () => {
    try {
        await transporter.verify();
        console.log("✅ SMTP verified");
    } catch (e) {
        console.error("❌ SMTP verify failed:", e.message);
    }
})();

async function sendWelcomeEmail(to, fullName) {
    const html = `
    <p>Chào mừng, ${fullName}!</p>
    <p>Cảm ơn bạn đã đăng ký tài khoản tại K Shopping.</p>
    <p>Chúng tôi rất vui khi có bạn đồng hành.</p>
  `;
    return transporter.sendMail({
        from: `"K Shopping" <${process.env.SMTP_USER}>`,
        to,
        subject: "Chào mừng bạn đến với K Shopping 🎉",
        html,
    });
}

async function sendTemporaryPasswordEmail(to, tempPassword) {
    const html = `
    <p>Xin chào,</p>
    <p>Cảm ơn bạn đã đăng ký tài khoản tại K Shopping.</p>
    <p>Mật khẩu tạm thời của bạn là: <b style="font-size:1.2rem; background: #eee; padding: 5px 8px; border-radius: 4px;">${tempPassword}</b></p>
    <p>Vui lòng sử dụng mật khẩu này để đăng nhập lần đầu và đổi mật khẩu ngay lập tức.</p>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
  `;
    return transporter.sendMail({
        from: `"K Shopping" <${process.env.SMTP_USER}>`,
        to,
        subject: "Mật khẩu tạm thời - K Shopping",
        html,
    });
}

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

module.exports = { sendOtpEmail, sendWelcomeEmail, sendTemporaryPasswordEmail };
