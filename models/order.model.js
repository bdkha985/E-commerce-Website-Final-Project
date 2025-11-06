// models/order.model.js
const { Schema, model } = require("mongoose");

// Schema cho từng sản phẩm trong đơn hàng
const OrderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Giá tại thời điểm mua
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

// Schema cho địa chỉ giao hàng
const ShippingAddressSchema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    city: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema(
    {
        // Mã đơn hàng (tùy chỉnh)
        code: {
            type: String,
            required: true,
            unique: true,
            default: () => `KSHOP-${Date.now().toString().slice(-6)}`
        },
        // Thông tin người dùng
        userId: { // Sẽ là null nếu là Guest Checkout
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            default: null
        },
        email: { // Email (bắt buộc, kể cả guest)
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        // Thông tin đơn hàng
        items: [OrderItemSchema], // Danh sách sản phẩm
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
        
        loyaltyPointsUsed: { type: Number, default: 0 }, // Số điểm đã dùng
        loyaltyPointsGained: { type: Number, default: 0 }, // Số điểm nhận được

        total: { type: Number, required: true }, // Tổng tiền cuối cùng
        
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
        // (Yêu cầu PDF) Lịch sử trạng thái [cite: 183-185]
        statusHistory: [{
            status: String,
            updatedAt: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

// Tự động thêm status 'Pending' vào lịch sử khi tạo mới
OrderSchema.pre('save', function (next) {
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({ status: this.status, updatedAt: new Date() });
    }
    next();
});

module.exports = model("Order", OrderSchema);