const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const Redis = require("ioredis");
const crypto = require("crypto");
const { sendTemporaryPasswordEmail } = require("../../utils/mailer");

const normalize = (s) =>
    String(s || "")
        .toLowerCase()
        .trim();

        
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const redisClient = new Redis(redisUrl);

const QUEUE_NAME = "email_queue";

async function createUserAndSendPassword({ email, fullName, address }) {
    const mail = normalize(email);
    const existing = await User.findOne({ email: mail });
    if (existing) throw new Error("Email đã được sử dụng");

    // 1. Tạo mật khẩu tạm thời
    const tempPassword = crypto.randomBytes(8).toString("hex");

    // 2. Hash mật khẩu tạm để lưu vào DB
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // 3. Tạo địa chỉ đầu tiên
    const firstAddress = {
        label: address.label || 'Địa chỉ 1',
        street: address.street,
        ward: address.ward,
        city: address.city,
        isDefault: true
    };

    // 4. Tạo đối tượng User
    const user = new User({
        email: mail,
        passwordHash,
        fullName,
        addresses: [firstAddress],
        roles: ["customer"],
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // 5. Lưu user vào DB
    await user.save();

    try {
      const welcomeJob = {
        email: user.email,
        fullName: user.fullName,
      };
      await redisClient.lpush(QUEUE_NAME, JSON.stringify(welcomeJob));
      console.log(`[App] Đã đẩy welcome email job cho ${user.email} vào hàng đợi.`);
    } catch (err) {
      console.error("[App] Lỗi khi đẩy welcome job vào Redis:", err);
    }
    
    // 6. Gửi email chứa mật khẩu tạm (chưa hash)
    try {
        await sendTemporaryPasswordEmail(user.email, tempPassword);
        console.log(`[App] Đã gửi mật khẩu tạm thời cho ${user.email}`);
    } catch (emailError) {
        console.error(`[App] Lỗi khi gửi mật khẩu tạm thời cho ${user.email}:`, emailError);
        throw new Error("Đăng ký thành công nhưng không thể gửi email mật khẩu.");
    }

    return {user,  tempPassword};
}

// Tìm user theo email
async function findUserByEmail(email) {
    return await User.findOne({ email: normalize(email) });
}

// Kiểm tra password với hash
async function validatePassword(user, password) {
    if (!user?.passwordHash) return false;
    try {
        return await bcrypt.compare(password, user.passwordHash);
    } catch {
        return false;
    }
}

module.exports = {
    findUserByEmail,
    validatePassword,
    createUserAndSendPassword,
};
