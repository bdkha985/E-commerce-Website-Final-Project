//routes/account.api.js

const express = require("express");
const { body } = require("express-validator");
const requireLoginApi = require("../../middlewares/requireLogin.api.js");
const ctrl = require("../../controllers/account/account.api.controller.js");
const {
    updateProfileRules,
    changePasswordRules,
    addAddressRules,
    handleApiValidation,
} = require("../../middlewares/authValidator");
const router = express.Router();

// Require login
router.use(requireLoginApi);

// Get personally information
router.get("/me", ctrl.getMe);

// Update profile
router.patch(
    "/profile",
    updateProfileRules, // Sử dụng rules
    handleApiValidation,
    ctrl.updateProfile
);

// Change password
router.post(
    "/change-password",
    changePasswordRules,
    handleApiValidation,
    ctrl.changePassword
);

// Address (CRUD)
router.get("/addresses", ctrl.listAddresses);
router.post(
    "/addresses",
    addAddressRules,
    handleApiValidation,
    ctrl.addAddress
);

router.patch("/addresses/:idx", ctrl.updateAddressByIndex);
router.delete("/addresses/:idx", ctrl.removeAddressByIndex);
router.post("/addresses/:idx/default", ctrl.setDefaultAddressByIndex);

// GET /api/account/orders
router.get("/orders", ctrl.getOrderHistory);

// GET /api/account/orders/:code
router.get("/orders/:code", ctrl.getOrderDetail);

module.exports = router;
