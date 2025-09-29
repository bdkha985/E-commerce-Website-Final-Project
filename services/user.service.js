const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const normalize = (s) =>
    String(s || "")
        .toLowerCase()
        .trim();

async function createUserLocal({ email, password, fullName, phone }) {
    const mail = normalize(email);
    const existing = await User.findOne({ email: mail });
    if (existing) throw new Error("Email đã được sử dụng");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
        email: mail,
        passwordHash,
        fullName,
        phone,
        roles: ["customer"],
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return await user.save();
}

async function findUserByEmail(email) {
    return await User.findOne({ email: normalize(email) });
}

async function validatePassword(user, password) {
    if (!user?.passwordHash) return false;
    try {
        return await bcrypt.compare(password, user.passwordHash);
    } catch {
        return false;
    }
}

module.exports = {
    createUserLocal,
    findUserByEmail,
    validatePassword,
};
