// models/review.model.js

const { Schema, model } = require("mongoose");
const Product = require("./product.model");

const ReviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        comment: {
            type: String,
            trim: true,
            default: "",
        },
        sentiment: {
            type: String,
            enum: ["Positive", "Negative", "Neutral"],
            default: "Neutral",
        },
    },
    { timestamps: true }
);

ReviewSchema.post("save", async function (doc) {
    try {
        await updateProductRating(doc.productId);
    } catch (err) {
        console.error("Lỗi khi cập nhật rating sau khi lưu review:", err);
    }
});

// Hàm helper để tính toán
async function updateProductRating(productId) {
    const reviewsWithRating = await model("Review", ReviewSchema).find({
        productId: productId,
        rating: { $ne: null },
    });

    if (reviewsWithRating.length === 0) {
        await Product.findByIdAndUpdate(productId, {
            ratingAvg: 0,
            ratingCount: 0,
        });
        return;
    }

    // 2. Tính tổng số sao và rating trung bình
    const ratingCount = reviewsWithRating.length;
    const ratingSum = reviewsWithRating.reduce(
        (acc, item) => acc + item.rating,
        0
    );
    const ratingAvg = (ratingSum / ratingCount).toFixed(1);

    // 3. Cập nhật lại model Product
    await Product.findByIdAndUpdate(productId, {
        ratingAvg: parseFloat(ratingAvg),
        ratingCount: ratingCount,
    });
}

module.exports = model("Review", ReviewSchema);
