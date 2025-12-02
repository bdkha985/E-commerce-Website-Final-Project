// controllers/checkout/checkout.controller.js
const cartService = require("../../services/cart/cart.service.js");
const Discount = require("../../models/discount.model.js");
const User = require("../../models/user.model.js");
const Order = require("../../models/order.model.js");
const orderService = require("../../services/order/order.service.js");
const vnpayService = require("../../services/payment/vnpay.service.js");

const getCheckoutPage = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req);
        if (cart.length === 0) {
            req.flash("error", "Giỏ hàng trống, không thể thanh toán.");
            return res.redirect("/cart");
        }
        let discountInfo = null;
        if (req.session.appliedDiscountCode) {
            discountInfo = await Discount.findOne({
                code: req.session.appliedDiscountCode,
            }).lean();
        }
        const summary = cartService.getCartTotals(cart, discountInfo);
        let userInfo = null;
        let loyaltyPoints = 0;
        let allUserAddresses = [];
        let defaultAddress = null;
        if (req.user) {
            const user = await User.findById(req.user.id)
                .select("fullName email phone addresses loyaltyPoints")
                .lean();
            if (user) {
                userInfo = {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone || "",
                };
                allUserAddresses = user.addresses;
                defaultAddress =
                    user.addresses.find((addr) => addr.isDefault === true) ||
                    (user.addresses.length ? user.addresses[0] : null);
                loyaltyPoints = user.loyaltyPoints?.balance || 0;
            }
        }
        res.render("layouts/main", {
            title: "Thanh toán",
            body: "pages/checkout",
            summary: summary,
            userInfo: userInfo,
            allUserAddresses: allUserAddresses,
            defaultAddress: defaultAddress,
            loyaltyPoints: loyaltyPoints,
        });
    } catch (err) {
        next(err);
    }
};

const handleVnpayReturn = async (req, res, next) => {
    try {
        const vnp_Params = req.query;
        const orderCode = vnp_Params["vnp_TxnRef"];
        const isVerified = vnpayService.verifyReturnUrl(vnp_Params);
        if (!isVerified) {
            throw new Error("Chữ ký VNPAY không hợp lệ.");
        }
        const order = await Order.findOne({ code: orderCode });
        if (!order) {
            throw new Error("Không tìm thấy đơn hàng.");
        }
        if (vnp_Params["vnp_ResponseCode"] === "00") {
            if (order.status !== "Pending") {
                req.flash(
                    "success",
                    `Đơn hàng ${orderCode} đã được xác nhận trước đó.`
                );
                return res.redirect(`/order/result/${orderCode}`);
            }
            await orderService.completeOrderProcessing(order._id);
            req.flash(
                "success",
                `Thanh toán thành công cho đơn hàng ${orderCode}!`
            );
            res.redirect(`/order/result/${orderCode}`);
        } else {
            order.status = "Cancelled";
            order.paymentStatus = "Failed";
            order.statusHistory.push({
                status: "Cancelled",
                updatedAt: new Date(),
            });
            await order.save();
            throw new Error("Thanh toán VNPAY thất bại.");
        }
    } catch (err) {
        req.flash("error", err.message || "Xử lý thanh toán VNPAY thất bại.");
        res.redirect("/cart");
    }
};

const getOrderResultPage = async (req, res, next) => {
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({ code: orderCode }).lean();

        if (!order) {
            req.flash("error", "Không tìm thấy đơn hàng.");
            return res.redirect("/account");
        }

        if (
            req.user &&
            order.userId &&
            order.userId.toString() !== req.user.id.toString()
        ) {
            req.flash("error", "Bạn không có quyền xem đơn hàng này.");
            return res.redirect("/");
        }

        const tempPassword = req.flash("tempPassword")[0];
        const tempEmail = req.flash('tempEmail')[0];

        res.render("layouts/main", {
            title: `Kết quả đơn hàng ${order.code}`,
            body: "pages/order-result",
            order: order,
            tempPassword: tempPassword,
            tempEmail: tempEmail,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCheckoutPage,
    handleVnpayReturn,
    getOrderResultPage,
};
