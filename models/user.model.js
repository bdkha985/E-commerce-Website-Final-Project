// models/user.model.js
const { Schema, model } = require('mongoose');

const AddressSchema = new Schema({
  label:     { type: String, trim: true },              // "Nhà", "Cty", v.v.
  fullName:  { type: String, trim: true },
  phone:     { type: String, trim: true },
  street:    { type: String, trim: true },
  ward:      { type: String, trim: true },
  district:  { type: String, trim: true },
  city:      { type: String, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const LoyaltySchema = new Schema({
  balance:       { type: Number, default: 0 },          // tích 10% đơn, dùng đơn sau
  lastUpdatedAt: { type: Date }
}, { _id: false });

const OAuthSchema = new Schema({
  googleId:   { type: String, index: true, sparse: true, unique: true },
  facebookId: { type: String, index: true, sparse: true, unique: true }
}, { _id: false });

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,           // tự chuyển lowercase
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,              // Với OAuth-only có thể rỗng
    default: null
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  roles: {
    type: [String],
    default: ['customer'],     // hoặc ['admin']
    enum: ['customer', 'admin']
  },
  addresses: {
    type: [AddressSchema],
    default: []
  },
  oauth: {
    type: OAuthSchema,
    default: {}
  },
  loyaltyPoints: {
    type: LoyaltySchema,
    default: () => ({ balance: 0, lastUpdatedAt: new Date() })
  }
}, { timestamps: true });

// Đảm bảo chỉ có 1 địa chỉ default = true
UserSchema.pre('save', function(next) {
  if (this.isModified('addresses') && Array.isArray(this.addresses)) {
    let hasDefault = false;
    this.addresses = this.addresses.map(addr => {
      if (addr.isDefault && !hasDefault) {
        hasDefault = true;
        return addr;
      }
      // nếu đã có default rồi thì các default còn lại chuyển false
      return { ...addr.toObject?.() ?? addr, isDefault: hasDefault ? false : !!addr.isDefault };
    });
  }
  next();
});

// Index gợi ý (tìm nhanh theo tên/điện thoại trong sổ địa chỉ)
UserSchema.index({ 'addresses.phone': 1 });
UserSchema.index({ 'addresses.city': 1 });

module.exports = model('User', UserSchema);
