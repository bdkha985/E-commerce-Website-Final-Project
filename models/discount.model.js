// models/discount.model.js
const { Schema, model } = require("mongoose");

const DiscountSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true, // Tự động viết hoa
            trim: true,
            minlength: 5, // Yêu cầu 5 ký tự
            maxlength: 5, // Yêu cầu 5 ký tự
        },
        discountValue: { // Giá trị giảm (VND)
            type: Number,
            required: true,
            min: 0
        },
        usageLimit: { // Giới hạn sử dụng (tối đa 10)
            type: Number,
            required: true,
            default: 10,
            max: 10
        },
        usageCount: { // Số lần đã dùng
            type: Number,
            default: 0
        },
        orderIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Order'
        }]
    },
    { timestamps: true }
);

module.exports = model("Discount", DiscountSchema);