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

async function sendOrderConfirmationEmail(toEmail, order) {
    // Helper để format tiền
    const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + 'đ';

    // Tạo danh sách item HTML
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${item.name} (SKU: ${item.sku})
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Cảm ơn bạn đã đặt hàng tại K Shopping!</h2>
        <p>Xin chào ${order.shippingAddress.fullName},</p>
        <p>Đơn hàng <strong>${order.code}</strong> của bạn đã được xác nhận thành công.</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Chi tiết đơn hàng</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 8px; border-bottom: 2px solid #333; text-align: left;">Sản phẩm</th>
                    <th style="padding: 8px; border-bottom: 2px solid #333; text-align: center;">SL</th>
                    <th style="padding: 8px; border-bottom: 2px solid #333; text-align: right;">Đơn giá</th>
                    <th style="padding: 8px; border-bottom: 2px solid #333; text-align: right;">Tổng</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Tổng cộng</h3>
        <table style="width: 100%; max-width: 400px; margin-left: auto;">
            <tbody>
                <tr>
                    <td style="padding: 5px;">Tạm tính:</td>
                    <td style="padding: 5px; text-align: right;">${formatCurrency(order.subtotal)}</td>
                </tr>
                <tr>
                    <td style="padding: 5px;">Phí vận chuyển:</td>
                    <td style="padding: 5px; text-align: right;">${formatCurrency(order.shippingFee)}</td>
                </tr>
                ${order.discountApplied > 0 ? `
                <tr>
                    <td style="padding: 5px;">Giảm giá (${order.discountCode}):</td>
                    <td style="padding: 5px; text-align: right;">-${formatCurrency(order.discountApplied)}</td>
                </tr>
                ` : ''}
                ${order.loyaltyPointsUsed > 0 ? `
                <tr style="color: #16a34a; font-weight: bold;">
                    <td style="padding: 5px;">Sử dụng điểm thưởng:</td>
                    <td style="padding: 5px; text-align: right;">-${formatCurrency(order.loyaltyPointsUsed)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td style="padding: 5px;">Thuế (VAT 8%):</td>
                    <td style="padding: 5px; text-align: right;">${formatCurrency(order.tax)}</td>
                </tr>
                <tr>
                    <td style="padding: 5px;"><strong>Tổng tiền:</strong></td>
                    <td style="padding: 5px; text-align: right;"><strong>${formatCurrency(order.total)}</strong></td>
                </tr>
            </tbody>
        </table>

        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Thông tin giao hàng</h3>
        <p>
            <strong>${order.shippingAddress.fullName}</strong><br>
            ${order.shippingAddress.phone}<br>
            ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.city}
        </p>
        <p>Cảm ơn bạn đã tin tưởng K Shopping!</p>
    </div>
  `;

    return transporter.sendMail({
        from: `"K Shopping" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[K Shopping] Xác nhận đơn hàng #${order.code}`,
        html,
    });
}

module.exports = { 
    sendOtpEmail, 
    sendWelcomeEmail, 
    sendTemporaryPasswordEmail,
    sendOrderConfirmationEmail,
 };
