// services/cart/cart.service.js
const Product = require('../../models/product.model');
const User = require('../../models/user.model');

/**
 * Lấy giỏ hàng (hoặc từ session, hoặc từ DB)
 */
async function getCart(req) {
    if (req.user) {
        const user = await User.findById(req.user.id).select('cart').lean();
        return user.cart || [];
    }
    if (!req.session.cart) {
        req.session.cart = [];
    }
    return req.session.cart;
}

/**
 * Lưu giỏ hàng (hoặc vào session, hoặc vào DB)
 */
async function saveCart(req, cart) {
    if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { $set: { cart: cart } });
    } else {
        req.session.cart = cart;
    }
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
async function addItemToCart(req, { productId, sku, quantity }) {
    const product = await Product.findById(productId).lean();
    if (!product) {
        throw new Error("Không tìm thấy sản phẩm");
    }
    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) {
        throw new Error("Biến thể sản phẩm không hợp lệ");
    }
    if (variant.stock < quantity) {
        throw new Error("Số lượng tồn kho không đủ");
    }
    const cart = await getCart(req);
    const existingItemIndex = cart.findIndex(item => item.sku === sku);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
        if (cart[existingItemIndex].quantity > variant.stock) {
             cart[existingItemIndex].quantity = variant.stock;
             await saveCart(req, cart); // Lưu lại trước khi báo lỗi
             throw new Error("Số lượng trong giỏ vượt quá tồn kho. Đã cập nhật tối đa.");
        }
    } else {
        cart.push({
            productId: product._id,
            sku: variant.sku,
            quantity: quantity,
            price: variant.price,
            name: product.name,
            image: (variant.images && variant.images[0]) || (product.images && product.images[0]) || '',
            slug: product.slug
        });
    }
    await saveCart(req, cart);
    return cart;
}

/**
 * Cập nhật số lượng (ĐÃ THÊM CHỐT AN TOÀN)
 */
async function updateItemQuantity(req, sku, newQuantity) {
    const cart = await getCart(req);
    const itemIndex = cart.findIndex(item => item.sku === sku);
    if (itemIndex === -1) {
        throw new Error("Sản phẩm không có trong giỏ hàng");
    }

    if (newQuantity <= 0) {
        cart.splice(itemIndex, 1);
    } else {
        // === CHỐT AN TOÀN BẮT ĐẦU ===
        const productId = cart[itemIndex].productId;
        if (!productId) {
            cart.splice(itemIndex, 1); // Xóa item lỗi
            await saveCart(req, cart);
            throw new Error("Sản phẩm trong giỏ bị lỗi, đã tự động xóa.");
        }
        
        const product = await Product.findById(productId).lean();
        if (!product) {
            cart.splice(itemIndex, 1); // Xóa item lỗi
            await saveCart(req, cart);
            throw new Error("Sản phẩm gốc không còn tồn tại, đã tự động xóa.");
        }
        // === CHỐT AN TOÀN KẾT THÚC ===

        const variant = product.variants.find(v => v.sku === sku);
        if (!variant) throw new Error("Biến thể không còn tồn tại");

        if (newQuantity > variant.stock) {
            cart[itemIndex].quantity = variant.stock;
            await saveCart(req, cart);
            throw new Error(`Số lượng tồn kho không đủ (chỉ còn ${variant.stock}). Đã cập nhật tối đa.`);
        }
        
        cart[itemIndex].quantity = newQuantity;
    }
    await saveCart(req, cart);
    return cart;
}

/**
 * Xóa 1 item khỏi giỏ hàng
 */
async function removeItemFromCart(req, sku) {
    let cart = await getCart(req);
    cart = cart.filter(item => item.sku !== sku);
    await saveCart(req, cart);
    return cart;
}

/**
 * Xóa toàn bộ giỏ hàng
 */
async function clearCart(req) {
    await saveCart(req, []);
    return [];
}

/**
 * (Helper) Tính toán lại tổng tiền (ĐÃ NÂNG CẤP)
 */
function getCartTotals(cart, discountInfo = null) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountApplied = 0;
    if (discountInfo) {
        discountApplied = Math.min(subtotal, discountInfo.discountValue);
    }

    const totalAfterDiscount = subtotal - discountApplied;
    const shippingFee = totalAfterDiscount > 0 ? 15000 : 0;
    const tax = totalAfterDiscount * 0.08;
    const total = totalAfterDiscount + shippingFee + tax;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
        subtotal,
        shippingFee,
        tax,
        discountApplied,
        total,
        totalItems,
        cart,
        appliedDiscountCode: discountInfo ? discountInfo.code : null,
    };
}

module.exports = {
    getCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    getCartTotals,
};