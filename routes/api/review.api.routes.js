// routes/api/review.api.routes.js
const express = require("express");
const { body } = require("express-validator");
const ctrl = require("../../controllers/api/review.api.controller");
const requireLoginApi = require("../../middlewares/requireLogin.api");

const router = express.Router();

// GET: Lấy review (ai cũng có thể gọi)
router.get("/:productId", ctrl.getReviews);

// POST 1: Gửi Comment (cho khách, không cần login)
router.post(
    "/:productId/comment",
    [
        body("fullName").notEmpty().withMessage("Vui lòng nhập tên"),
        body("comment").notEmpty().withMessage("Vui lòng nhập bình luận"),
    ],
    ctrl.postComment
);

// POST 2: Gửi Rating (cho user, BẮT BUỘC login)
router.post(
    "/:productId/rate",
    requireLoginApi, // <-- Chỉ user đã login mới được rate
    [
        body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating phải từ 1 đến 5 sao"),
        body("comment").optional().trim(),
    ],
    ctrl.postRating
);

module.exports = router;