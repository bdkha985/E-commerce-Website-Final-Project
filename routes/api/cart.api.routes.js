// routes/api/cart.api.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const cartApiController = require("../../controllers/cart/cart.api.controller");
const { handleApiValidation } = require("../../middlewares/authValidator");
const {
    addToCartRules,
    updateCartItemRules,
    applyDiscountRules,
} = require("../../middlewares/cartValidator");

// POST /api/cart/add
router.post(
    "/add",
    addToCartRules,
    handleApiValidation,
    cartApiController.addToCart
);

// PATCH /api/cart/update/:sku
router.patch(
    "/update/:sku",
    updateCartItemRules,
    handleApiValidation,
    cartApiController.updateItem
);

// DELETE /api/cart/remove/:sku
router.delete("/remove/:sku", cartApiController.removeItem);

// DELETE /api/cart/clear
router.delete("/clear", cartApiController.clearCart);

// POST /api/cart/apply-discount
router.post(
    "/apply-discount",
    applyDiscountRules,
    handleApiValidation,
    cartApiController.applyDiscount
);

// GET /api/cart/items
router.get("/items", cartApiController.getCartItems);

module.exports = router;
