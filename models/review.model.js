// models/review.model.js
const { Schema, model } = require("mongoose");
const Product = require("./product.model"); // Import model Product

const ReviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: { // Có thể là null nếu là khách
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        fullName: { // Tên người dùng (lấy từ tài khoản hoặc khách tự nhập)
            type: String,
            required: true,
            trim: true,
        },
        rating: { // Số sao
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        comment: { // Nội dung bình luận
            type: String,
            trim: true,
            default: "",
        },
        sentiment: {
            type: String,
            enum: ['Positive', 'Negative', 'Neutral'],
            default: 'Neutral'
        },
    },
    { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// === Rất quan trọng: Tính toán lại Rating trung bình ===
// Sau mỗi lần một review được LƯU (save)
ReviewSchema.post("save", async function (doc) {
    try {
        await updateProductRating(doc.productId);
    } catch (err) {
        console.error("Lỗi khi cập nhật rating sau khi lưu review:", err);
    }
});

// Hàm helper để tính toán
async function updateProductRating(productId) {
    // 1. LẤY NHỮNG REVIEW CÓ RATING (sao)
    const reviewsWithRating = await model("Review", ReviewSchema).find({
        productId: productId,
        rating: { $ne: null } // <-- CHỈ LẤY NHỮNG DOCS CÓ RATING
    });

    if (reviewsWithRating.length === 0) {
        // Nếu không có review nào có sao, reset về 0
        await Product.findByIdAndUpdate(productId, {
            ratingAvg: 0,
            ratingCount: 0,
        });
        return;
    }

    // 2. Tính tổng số sao và rating trung bình
    const ratingCount = reviewsWithRating.length; // <-- Chỉ đếm review có sao
    const ratingSum = reviewsWithRating.reduce((acc, item) => acc + item.rating, 0);
    const ratingAvg = (ratingSum / ratingCount).toFixed(1); // Làm tròn 1 chữ số

    // 3. Cập nhật lại model Product
    await Product.findByIdAndUpdate(productId, {
        ratingAvg: parseFloat(ratingAvg),
        ratingCount: ratingCount,
    });
}

module.exports = model("Review", ReviewSchema);