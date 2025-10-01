// models/passwordReset.model.js
const { Schema, model } = require("mongoose");

const PasswordResetSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    resetToken: {
        type: String,
        default: null,
    },
    resetTokenExpiresAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 1800, // auto delete sau 30 phút (TTL index)
    },
});

// Index hỗ trợ TTL cleanup
PasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = model("PasswordReset", PasswordResetSchema);
