//routes/account.api.js

const express = require("express");
const { body } = require("express-validator");
const requireLoginApi = require("../../middlewares/requireLogin.api.js");
const ctrl = require("../../controllers/account/account.api.controller.js");

const router = express.Router();

// Require login
router.use(requireLoginApi);

// Get personally information
router.get("/me", ctrl.getMe);

// Update profile
router.patch(
    "/profile",
    [
        body("fullName")
            .optional()
            .isLength({ min: 2 })
            .withMessage("Tên quá ngắn"),
        body("phone")
            .optional()
            .matches(/^0\d{9,10}$/)
            .withMessage("Số điện thoại không hợp lệ!"),
    ],
    ctrl.updateProfile
);

//Change password
router.post(
    "/change-password",
    [
        body("currentPassword").isLength({ min: 6 }),
        body("newPassword").isLength({ min: 6 }),
        body("confirmPassword")
            .custom((v, { req }) => v === req.body.newPassword)
            .withMessage("Xác nhận mật khẩu không khớp"),
    ],
    ctrl.changePassword
);

// Address (CRUD)
router.get("/addresses", ctrl.listAddresses);
router.post(
    "/addresses",
    [
        body("label").notEmpty(),
        body("street").notEmpty(),
        body("ward").notEmpty(),
        body("city").notEmpty(),
    ],
    ctrl.addAddress
);
router.patch("/addresses/:idx", ctrl.updateAddressByIndex);
router.delete("/addresses/:idx", ctrl.removeAddressByIndex);
router.post("/addresses/:idx/default", ctrl.setDefaultAddressByIndex);

// GET /api/account/orders
router.get("/orders", ctrl.getOrderHistory);

// GET /api/account/orders/:code (Phải có :code)
router.get("/orders/:code", ctrl.getOrderDetail);

module.exports = router;
