// models/order.model.js
const { Schema, model } = require("mongoose");

const OrderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const ShippingAddressSchema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    city: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema(
    {
        // Mã đơn hàng
        code: {
            type: String,
            required: true,
            unique: true,
            default: () => `KSHOP-${Date.now().toString().slice(-6)}`
        },
        // Thông tin người dùng
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            default: null
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        // Thông tin đơn hàng
        items: [OrderItemSchema],
        shippingAddress: {
            type: ShippingAddressSchema,
            required: true
        },
        notes: {
            type: String,
            default: ''
        },
        // Thông tin thanh toán
        subtotal: { type: Number, required: true },
        shippingFee: { type: Number, required: true, default: 0 },
        tax: { type: Number, required: true, default: 0 },
        
        discountCode: { type: String, default: null },
        discountApplied: { type: Number, default: 0 },
        
        loyaltyPointsUsed: { type: Number, default: 0 },
        loyaltyPointsGained: { type: Number, default: 0 },

        total: { type: Number, required: true },
        
        paymentMethod: {
            type: String,
            required: true,
            enum: ['COD', 'VNPAY']
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
        },
        
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'],
            default: 'Pending'
        },
        statusHistory: [{
            status: String,
            updatedAt: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

OrderSchema.pre('save', function (next) {
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({ status: this.status, updatedAt: new Date() });
    }
    next();
});

module.exports = model("Order", OrderSchema);