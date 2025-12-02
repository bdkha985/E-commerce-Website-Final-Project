// routes/api/review.api.routes.js
const express = require("express");
const { body } = require("express-validator");
const ctrl = require("../../controllers/api/review.api.controller");
const requireLoginApi = require("../../middlewares/requireLogin.api");
const {
    reviewCommentRules,
    reviewRatingRules,
} = require("../../middlewares/featureValidator");
const { handleApiValidation } = require("../../middlewares/authValidator");

const router = express.Router();

// GET: Lấy review (ai cũng có thể gọi)
router.get("/:productId", ctrl.getReviews);

// POST 1: Gửi Comment (cho khách, không cần login)
router.post(
    "/:productId/comment",
    reviewCommentRules,
    handleApiValidation,
    ctrl.postComment
);

// POST 2: Gửi Rating (cho user, BẮT BUỘC login)
router.post(
    "/:productId/rate",
    requireLoginApi,
    reviewRatingRules,
    handleApiValidation,
    ctrl.postRating
);

module.exports = router;
