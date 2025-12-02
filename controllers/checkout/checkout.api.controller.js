// controllers/checkout/checkout.api.controller.js

const { validationResult } = require("express-validator");
const orderService = require("../../services/order/order.service.js");
const vnpayService = require("../../services/payment/vnpay.service.js");
const cartService = require("../../services/cart/cart.service.js");

const placeOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ ok: false, message: errors.array()[0].msg });
    }

    try {
        const {
            fullName,
            email,
            phone,
            street,
            ward,
            city,
            notes,
            paymentMethod,
        } = req.body;
        const useLoyalty =
            req.body.useLoyalty === true ||
            req.body.useLoyalty === "true" ||
            req.body.useLoyalty === "on";

        const orderData = {
            email: email,
            shippingAddress: { fullName, phone, street, ward, city },
            notes: notes || "",
            paymentMethod: paymentMethod,
            useLoyalty: useLoyalty,
        };

        // 1. Tạo đơn hàng (Status: Pending)
        const { order, tempPassword } = await orderService.createPendingOrder(
            req,
            orderData
        );

        await cartService.clearCart(req);
        req.session.appliedDiscountCode = null;

        if (tempPassword) {
            req.flash("tempPassword", tempPassword);
            req.flash("tempEmail", order.email);
        }

        if (paymentMethod === "COD") {
            await orderService.completeOrderProcessing(order._id);

            res.status(201).json({
                ok: true,
                type: "COD",
                message: "Đặt hàng COD thành công!",
                orderId: order._id,
                orderCode: order.code,
            });
        } else if (paymentMethod === "VNPAY") {
            const paymentUrl = vnpayService.createPaymentUrl(req, order);

            res.status(200).json({
                ok: true,
                type: "VNPAY",
                paymentUrl: paymentUrl,
            });
        } else {
            throw new Error("Phương thức thanh toán không hợp lệ");
        }
    } catch (err) {
        res.status(400).json({
            ok: false,
            message: err.message || "Không thể đặt hàng",
        });
    }
};

module.exports = {
    placeOrder,
};
