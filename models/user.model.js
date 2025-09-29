const { Schema, model } = require("mongoose");

const AddressSchema = new Schema(
    {
        label: { type: String, trim: true },
        street: { type: String, trim: true },
        ward: { type: String, trim: true },
        city: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: false }
);

const LoyaltySchema = new Schema(
    {
        balance: { type: Number, default: 0 },
        lastUpdatedAt: { type: Date },
    },
    { _id: false }
);

const OAuthSchema = new Schema(
    {
        googleId: { type: String, index: true, sparse: true, unique: true },
        facebookId: { type: String, index: true, sparse: true, unique: true },
    },
    { _id: false }
);

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            default: null,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: false,
            trim: true,
        },
        roles: {
            type: [String],
            default: ["customer"],
            enum: ["customer", "admin"],
        },
        addresses: {
            type: [AddressSchema],
            default: [],
        },
        oauth: {
            type: OAuthSchema,
            default: {},
        },
        avatarUrl: {
            type: String,
            trim: true,
            default: "",
        },
        loyaltyPoints: {
            type: LoyaltySchema,
            default: () => ({ balance: 0, lastUpdatedAt: new Date() }),
        },
    },
    { timestamps: true }
);

// Đảm bảo chỉ có 1 địa chỉ default = true
UserSchema.pre("save", function (next) {
    if (this.isModified("addresses") && Array.isArray(this.addresses)) {
        let hasDefault = false;
        this.addresses = this.addresses.map((addr) => {
            if (addr.isDefault && !hasDefault) {
                hasDefault = true;
                return addr;
            }
            return { ...(addr.toObject?.() ?? addr), isDefault: false };
        });
    }
    next();
});

// Index gợi ý (tìm nhanh theo city)
UserSchema.index({ "addresses.city": 1 });

module.exports = model("User", UserSchema);
