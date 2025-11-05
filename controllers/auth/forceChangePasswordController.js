// controllers/forceChangePasswordController.js
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/user.model");

async function forceChangePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ ok: false, message: errors.array()[0].msg });
    }

    // Lấy userId từ session (đã lưu ở bước đăng nhập)
    const userId = req.session.tempUserId;
    if (!userId) {
        return res.status(401).json({ ok: false, message: "Phiên không hợp lệ hoặc đã hết hạn." });
    }

    const { newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            // Xóa session tạm nếu user không tồn tại
            delete req.session.tempUserId;
            delete req.session.tempUserEmail;
            return res.status(404).json({ ok: false, message: "Không tìm thấy người dùng." });
        }

        // Hash mật khẩu mới
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu và cờ
        user.passwordHash = passwordHash;
        user.mustChangePassword = false; // <-- Đặt lại cờ
        await user.save();

        // Xóa session tạm
        delete req.session.tempUserId;
        delete req.session.tempUserEmail;

        // Đăng nhập chính thức cho người dùng
        req.session.userId = user._id.toString();
        req.session.fullName = user.fullName;
        req.session.role = (user.roles || []).includes("admin") ? "admin" : "customer";
        // ... (các thông tin session khác nếu cần) ...

        res.json({ ok: true, message: "Đổi mật khẩu thành công." });

    } catch (err) {
        console.error("Lỗi khi đổi mật khẩu bắt buộc:", err);
        res.status(500).json({ ok: false, message: "Lỗi máy chủ nội bộ." });
    }
}

module.exports = { forceChangePassword };