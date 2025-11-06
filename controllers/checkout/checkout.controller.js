// controllers/checkout/checkout.controller.js
const cartService = require('../../services/cart/cart.service.js');
const Discount = require('../../models/discount.model.js');
const User = require('../../models/user.model'); // Cần để lấy địa chỉ

const getCheckoutPage = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req);

        if (cart.length === 0) {
            req.flash('error', 'Giỏ hàng trống, không thể thanh toán.');
            return res.redirect('/cart');
        }

        let discountInfo = null;
        if (req.session.appliedDiscountCode) {
            discountInfo = await Discount.findOne({ code: req.session.appliedDiscountCode }).lean();
        }

        const summary = cartService.getCartTotals(cart, discountInfo);

        // === PHẦN NÂNG CẤP BẮT ĐẦU TỪ ĐÂY ===
        let userInfo = null;
        let loyaltyPoints = 0;
        let allUserAddresses = []; // <--- MỚI: Biến chứa TẤT CẢ địa chỉ
        let defaultAddress = null;   // <--- MỚI: Biến chứa địa chỉ mặc định

        if (req.user) {
            // Lấy thêm 'phone' và 'addresses' đầy đủ
            const user = await User.findById(req.user.id).select('fullName email phone addresses loyaltyPoints').lean();
            if (user) {
                // 1. Lấy thông tin cơ bản (GIỜ ĐÃ CÓ PHONE)
                userInfo = {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone || '' // <-- Lấy SĐT chính của user
                };

                // 2. Lấy toàn bộ địa chỉ
                allUserAddresses = user.addresses; 
                
                // 3. Tìm địa chỉ mặc định
                defaultAddress = user.addresses.find(addr => addr.isDefault === true) || 
                                 (user.addresses.length ? user.addresses[0] : null);

                // 4. Lấy điểm
                loyaltyPoints = user.loyaltyPoints?.balance || 0;
            }
        }
        
        res.render('layouts/main', {
            title: 'Thanh toán',
            body: 'pages/checkout',
            summary: summary,
            userInfo: userInfo,           // Info (có phone)
            allUserAddresses: allUserAddresses, // <--- MỚI: Truyền toàn bộ địa chỉ
            defaultAddress: defaultAddress,
            loyaltyPoints: loyaltyPoints     // <--- MỚI: Truyền địa chỉ mặc định
        });
        // === KẾT THÚC NÂNG CẤP ===

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCheckoutPage,
};