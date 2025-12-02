const { body } = require("express-validator");

const chatbotRules = [
    body("message")
        .trim()
        .notEmpty()
        .withMessage("Vui lòng nhập nội dung tin nhắn"),
];

const reviewCommentRules = [
    body("fullName").trim().notEmpty().withMessage("Họ tên là bắt buộc"),
    body("comment")
        .trim()
        .notEmpty()
        .withMessage("Nội dung bình luận là bắt buộc"),
];

const reviewRatingRules = [
    body("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Đánh giá sao không hợp lệ"),
    // Comment trong rating là optional
];

module.exports = {
    chatbotRules,
    reviewCommentRules,
    reviewRatingRules,
};
