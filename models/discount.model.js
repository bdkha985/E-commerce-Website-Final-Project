// models/discount.model.js
const { Schema, model } = require("mongoose");

const DiscountSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 5,
            maxlength: 5,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        usageLimit: {
            type: Number,
            required: true,
            default: 10,
            max: 10,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        orderIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "Order",
            },
        ],
    },
    { timestamps: true }
);

module.exports = model("Discount", DiscountSchema);
