// services/order/order.service.js
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const Discount = require("../../models/discount.model");
const Order = require("../../models/order.model");
const cartService = require("../cart/cart.service");
const { createUserAndSendPassword } = require("../auth/user.service");
const { sendOrderConfirmationEmail } = require("../../utils/mailer");

async function createPendingOrder(req, orderData) {
    // 1. Lấy giỏ hàng
    const cart = await cartService.getCart(req);
    if (cart.length === 0) {
        throw new Error("Giỏ hàng của bạn đang trống.");
    }

    // 2. Kiểm tra mã giảm giá (nếu có)
    let discountInfo = null;
    const discountCode = req.session.appliedDiscountCode || null;
    if (discountCode) {
        discountInfo = await Discount.findOne({ code: discountCode });
        if (
            !discountInfo ||
            discountInfo.usageCount >= discountInfo.usageLimit
        ) {
            throw new Error("Mã giảm giá không còn hợp lệ.");
        }
    }

    // 3. Tính toán tổng tiền
    const summary = cartService.getCartTotals(cart, discountInfo);

    let loyaltyPointsUsed = 0;
    let userId = req.user ? req.user.id : null;
    let tempPassword = null;

    if (req.user) {
        const user = await User.findById(req.user.id)
            .select("loyaltyPoints email")
            .lean();

        if (orderData.useLoyalty && user?.loyaltyPoints?.balance > 0) {
            loyaltyPointsUsed = Math.min(
                user.loyaltyPoints.balance,
                summary.total
            );
        }
    } else if (orderData.email) {
        const existingUser = await User.findOne({ email: orderData.email });
        if (existingUser) {
            userId = existingUser._id;
        } else {
            const { user: newUser, tempPassword: newTempPassword } =
                await createUserAndSendPassword({
                    email: orderData.email,
                    fullName: orderData.shippingAddress.fullName,
                    address: orderData.shippingAddress,
                });
            userId = newUser._id;
            tempPassword = newTempPassword;
        }
    }

    // 5. Kiểm tra Tồn Kho
    for (const item of cart) {
        const product = await Product.findById(item.productId)
            .select("variants")
            .lean();
        if (!product)
            throw new Error(`Sản phẩm "${item.name}" không còn tồn tại.`);
        const variant = product.variants.find((v) => v.sku === item.sku);
        if (!variant || variant.stock < item.quantity) {
            throw new Error(
                `Sản phẩm "${item.name}" (SKU: ${item.sku}) không đủ tồn kho.`
            );
        }
    }

    // 6. Tính điểm Loyalty nhận được
    const finalTotal = summary.total - loyaltyPointsUsed;
    const loyaltyPointsGained =
        orderData.paymentMethod === "COD" ? Math.floor(finalTotal * 0.1) : 0;

    // 7. Tạo đơn hàng
    const order = new Order({
        userId: userId,
        email: orderData.email,
        items: cart,
        shippingAddress: orderData.shippingAddress,
        notes: orderData.notes,
        subtotal: summary.subtotal,
        shippingFee: summary.shippingFee,
        tax: summary.tax,
        discountCode: summary.appliedDiscountCode,
        discountApplied: summary.discountApplied,

        loyaltyPointsUsed: loyaltyPointsUsed,
        loyaltyPointsGained: loyaltyPointsGained,

        total: finalTotal,

        paymentMethod: orderData.paymentMethod,
        paymentStatus: "Pending",
    });

    await order.save();

    return { order, tempPassword };
}

async function completeOrderProcessing(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.status !== "Pending") {
        console.log(`Đơn hàng ${order.code} đã được xử lý trước đó.`);
        return order;
    }

    // 1. Cập nhật mã giảm giá
    if (order.discountCode) {
        await Discount.updateOne(
            { code: order.discountCode },
            { $inc: { usageCount: 1 }, $push: { orderIds: order._id } }
        );
    }

    // 2. Tính điểm
    if (order.paymentMethod === "VNPAY") {
        order.loyaltyPointsGained = Math.floor(order.total * 0.1);
    }

    // 3. Cập nhật điểm cho User
    if (order.userId) {
        await User.findByIdAndUpdate(order.userId, {
            $inc: {
                "loyaltyPoints.balance":
                    order.loyaltyPointsGained - order.loyaltyPointsUsed,
            },
            $set: { "loyaltyPoints.lastUpdatedAt": new Date() },
        });
    }

    // 4. Trừ tồn kho
    for (const item of order.items) {
        await Product.updateOne(
            { _id: item.productId, "variants.sku": item.sku },
            { $inc: { "variants.$.stock": -item.quantity } }
        );
    }

    // 5. Cập nhật trạng thái
    order.status = "Confirmed";
    order.paymentStatus = order.paymentMethod === "VNPAY" ? "Paid" : "Pending";
    order.statusHistory.push({ status: "Confirmed", updatedAt: new Date() });

    await order.save();

    // 6. Gửi mail
    try {
        await sendOrderConfirmationEmail(order.email, order);
        console.log(`[Order Service] Đã gửi email confirm cho ${order.code}`);
    } catch (emailErr) {
        console.error(
            `[Order Service] Lỗi gửi email cho ${order.code}:`,
            emailErr
        );
    }

    return order;
}

module.exports = {
    createPendingOrder,
    completeOrderProcessing,
};
