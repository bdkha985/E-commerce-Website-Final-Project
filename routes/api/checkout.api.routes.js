// routes/api/checkout.api.routes.js
const express = require("express");
const router = express.Router();
const checkoutApiController = require("../../controllers/checkout/checkout.api.controller");
const { handleApiValidation } = require("../../middlewares/authValidator");
const { placeOrderRules } = require("../../middlewares/checkoutValidator");

// POST /api/checkout
router.post(
    "/",
    placeOrderRules,
    handleApiValidation,
    checkoutApiController.placeOrder
);

// GET /api/checkout/vnpay_return
router.get("/vnpay_return", (req, res) => {
    res.send("ĐANG XỬ LÝ VNPAY...");
});

module.exports = router;
