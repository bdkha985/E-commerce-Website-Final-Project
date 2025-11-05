// controllers/cartController.js
const cartService = require('../../services/cart/cart.service');

const getCartPage = async (req, res, next) => {
    try {
        // Lấy giỏ hàng (đã được tải sẵn bởi middleware trong app.js)
        const cartItems = res.locals.cartItems || [];

        // Tính toán tổng tiền
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Tạm thời hardcode thuế và vận chuyển theo yêu cầu PDF
        const shippingFee = subtotal > 0 ? 15000 : 0; 
        const tax = subtotal * 0.08; // 8% VAT
        const total = subtotal + shippingFee + tax;

        res.render('layouts/main', {
            title: 'Giỏ hàng',
            body: 'pages/cart',
            // cartItems đã có sẵn trong res.locals, nhưng truyền lại cho rõ ràng
            cartItems: cartItems, 
            cartSummary: {
                subtotal,
                shippingFee,
                tax,
                total
            }
        });

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCartPage,
};