// services/cart.service.js
const Product = require('../models/product.model');
const User = require('../models/user.model');

/**
 * Lấy giỏ hàng (hoặc từ session, hoặc từ DB)
 */
async function getCart(req) {
    if (req.user) {
        // Nếu đã đăng nhập, lấy giỏ hàng từ User model
        const user = await User.findById(req.user.id).select('cart').lean();
        return user.cart || [];
    }
    // Nếu là khách, lấy từ session
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
        // Nếu đã đăng nhập, lưu vào User model
        await User.findByIdAndUpdate(req.user.id, { $set: { cart: cart } });
    } else {
        // Nếu là khách, lưu vào session
        req.session.cart = cart;
    }
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
async function addItemToCart(req, { productId, sku, quantity }) {
    // 1. Lấy sản phẩm và variant
    const product = await Product.findById(productId).lean();
    if (!product) {
        throw new Error("Không tìm thấy sản phẩm");
    }

    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) {
        throw new Error("Biến thể sản phẩm không hợp lệ");
    }

    // 2. Kiểm tra tồn kho
    if (variant.stock < quantity) {
        throw new Error("Số lượng tồn kho không đủ");
    }

    // 3. Lấy giỏ hàng hiện tại
    const cart = await getCart(req);

    // 4. Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItemIndex = cart.findIndex(item => item.sku === sku);

    if (existingItemIndex > -1) {
        // Cập nhật số lượng
        cart[existingItemIndex].quantity += quantity;
        // (Tùy chọn: kiểm tra lại tồn kho tổng)
        if (cart[existingItemIndex].quantity > variant.stock) {
             cart[existingItemIndex].quantity = variant.stock; // Giới hạn bằng tồn kho
             throw new Error("Số lượng trong giỏ vượt quá tồn kho. Đã cập nhật tối đa.");
        }
    } else {
        // Thêm mới
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

    // 5. Lưu lại giỏ hàng
    await saveCart(req, cart);

    return cart;
}

async function updateItemQuantity(req, sku, newQuantity) {
    const cart = await getCart(req);
    const itemIndex = cart.findIndex(item => item.sku === sku);

    if (itemIndex === -1) {
        throw new Error("Sản phẩm không có trong giỏ hàng");
    }

    if (newQuantity <= 0) {
        // Nếu giảm về 0, coi như xóa
        cart.splice(itemIndex, 1);
    } else {
        // Cần kiểm tra lại stock (logic quan trọng!)
        const product = await Product.findById(cart[itemIndex].productId).lean();
        const variant = product.variants.find(v => v.sku === sku);
        
        if (!variant) throw new Error("Biến thể không còn tồn tại");

        if (newQuantity > variant.stock) {
            cart[itemIndex].quantity = variant.stock; // Chỉ cho phép tối đa
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
 * (Helper) Tính toán lại tổng tiền
 * Sẽ được dùng chung cho tất cả các hàm API
 */
function getCartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = subtotal > 0 ? 15000 : 0; // 15k
    const tax = subtotal * 0.08; // 8% VAT
    const total = subtotal + shippingFee + tax;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
        subtotal,
        shippingFee,
        tax,
        total,
        totalItems,
        cart, // Trả lại giỏ hàng mới
    };
}

module.exports = {
    getCart,
    addItemToCart,
    updateItemQuantity, // <-- THÊM VÀO
    removeItemFromCart, // <-- THÊM VÀO
    clearCart,          // <-- THÊM VÀO
    getCartTotals,      // <-- THÊM VÀO
};