// controllers/api/review.api.controller.js
const { validationResult } = require("express-validator");
const Review = require("../../models/review.model");
const Product = require("../../models/product.model"); 
const { analyzeSentiment } = require('../../services/ai/gemini.service');

// GET /api/reviews/:productId
const getReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 5; 
        const skip = (page - 1) * limit;

        const sortQuery = req.query.sort || 'newest';
        let sort = {};
        switch (sortQuery) {
            case 'oldest':
                sort = { createdAt: 1 };
                break;
            case 'highest':
                sort = { rating: -1, createdAt: -1 };
                break;
            case 'lowest':
                sort = { rating: 1, createdAt: 1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        const [reviews, totalReviews] = await Promise.all([
            Review.find({ productId })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("userId", "fullName")
                .lean(),
            Review.countDocuments({ productId })
        ]);

        const totalPages = Math.max(1, Math.ceil(totalReviews / limit) || 1);

        res.json({
            ok: true,
            reviews,
            pagination: { page, totalPages, totalReviews },
            sort: sortQuery
        });

    } catch (err) {
        res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
    }
};

// POST 1: Gửi Comment (Cho khách)
const postComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ ok: false, message: errors.array()[0].msg });
    }

    try {
        const { productId } = req.params;
        const { fullName, comment } = req.body;

        if (!comment || !fullName) {
             return res.status(400).json({ ok: false, message: "Tên và bình luận là bắt buộc." });
        }

        const sentiment = await analyzeSentiment(comment, null);

        const newReview = new Review({
            productId,
            userId: null,
            fullName: fullName,
            comment: comment,
            rating: null,
            sentiment: sentiment
        });

        await newReview.save(); 

        const io = req.app.get('io'); 
        io.to(productId).emit('new_review', newReview);

        res.status(201).json({ ok: true, message: "Đã gửi bình luận thành công", review: newReview });

    } catch (err) {
        res.status(500).json({ ok: false, message: "Không thể gửi bình luận" });
    }
};

// POST /api/reviews/:productId
// POST 2: Gửi Rating (Cho User đã đăng nhập)
const postRating = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ ok: false, message: errors.array()[0].msg });
    }
    
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const star = parseInt(rating, 10);

        const sentiment = await analyzeSentiment(comment, star);

        let newReview = new Review({
            productId,
            userId: req.user.id, 
            fullName: req.user.fullName,
            rating: parseInt(rating, 10),
            comment: comment || "",
            sentiment: sentiment
        });

        await newReview.save(); 

        newReview = newReview.toObject();
        newReview.userId = { fullName: req.user.fullName };
        
        const io = req.app.get('io');
        io.to(productId).emit('new_review', newReview);

        res.status(201).json({ ok: true, message: "Đã gửi đánh giá thành công", review: newReview });

    } catch (err) {
        res.status(500).json({ ok: false, message: "Không thể gửi đánh giá" });
    }
};

module.exports = {
    getReviews,
    postComment,
    postRating,
};