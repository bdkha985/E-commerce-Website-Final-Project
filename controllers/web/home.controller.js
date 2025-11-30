// controllers/web/home.controller.js
const Product = require("../../models/product.model");
const Category = require("../../models/category.model");
const { sendContactEmail, sendNewsletterNotification } = require('../../utils/mailer');

function render(res, viewPath, locals = {}) {
    res.render("layouts/main", { body: viewPath, ...locals });
}

function getDisplayImage(p) {
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    if (Array.isArray(p.variants) && p.variants[0]?.images?.length)
        return p.variants[0].images[0];
    return "https://placehold.co/600x600?text=No+Image";
}

function getDisplayPrice(p) {
    if (Array.isArray(p.variants) && p.variants.length) {
        const prices = p.variants
            .map((v) => v.price)
            .filter((n) => typeof n === "number");
        if (prices.length) return Math.min(...prices);
    }
    return typeof p.basePrice === "number" ? p.basePrice : 0;
}

const getHomePage = async (req, res, next) => {
    try {
        // Lấy ID 3 danh mục chúng ta muốn hiển thị
        const [catAoNam, catDamNu, catSneaker] = await Promise.all([
            Category.findOne({ slug: 'ao-nam' }).select('_id').lean(),
            Category.findOne({ slug: 'dam-nu' }).select('_id').lean(),
            Category.findOne({ slug: 'sneaker' }).select('_id').lean()
        ]);

        // Tải tất cả 5 nhóm sản phẩm cùng lúc
        const [
            bestSellersData, 
            newCollectionData, 
            aoNamProductsData, 
            damNuProductsData, 
            sneakerProductsData
        ] = await Promise.all([
            // 1. Best Sellers (Giữ nguyên)
            Product.find()
                .sort({ ratingCount: -1, ratingAvg: -1, createdAt: -1 })
                .limit(12)
                .lean(),
            // 2. New Collection (Giữ nguyên)
            Product.find().sort({ createdAt: -1 }).limit(12).lean(),
            
            // 3. Category "Áo Nam"
            catAoNam 
                ? Product.find({ categoryIds: catAoNam._id }).limit(12).lean() 
                : Promise.resolve([]),
            // 4. Category "Đầm Nữ"
            catDamNu 
                ? Product.find({ categoryIds: catDamNu._id }).limit(12).lean() 
                : Promise.resolve([]),
            // 5. Category "Sneaker"
            catSneaker 
                ? Product.find({ categoryIds: catSneaker._id }).limit(12).lean() 
                : Promise.resolve([])
        ]);

        const mapView = (arr) =>
            (arr || []).map((p) => ({
                ...p,
                _thumb: getDisplayImage(p),
                _price: getDisplayPrice(p),
            }));

        return res.render("layouts/main", {
            title: "Trang chủ",
            body: "pages/index",
            bestSellers: mapView(bestSellersData),
            newCollection: mapView(newCollectionData),
            // Truyền 3 danh mục mới ra view
            aoNamProducts: mapView(aoNamProductsData),
            damNuProducts: mapView(damNuProductsData),
            sneakerProducts: mapView(sneakerProductsData),
        });
    } catch (err) {
        next(err);
    }
};

// === XỬ LÝ FORM LIÊN HỆ ===
const postContact = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, message } = req.body;
        
        // Gửi mail cho Admin
        await sendContactEmail({ firstName, lastName, email, phone, message });
        
        req.flash('success', 'Tin nhắn của bạn đã được gửi! Chúng tôi sẽ phản hồi sớm.');
        res.redirect('/contact');
    } catch (err) {
        console.error("Contact Error:", err);
        req.flash('error', 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
        res.redirect('/contact');
    }
};

// === XỬ LÝ FORM NEWSLETTER ===
const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if(email) {
            await sendNewsletterNotification(email);
            req.flash('success', 'Đăng ký nhận tin thành công!');
        }
        res.redirect('back'); // Quay lại trang cũ (dù đang ở Home hay Blog)
    } catch (err) {
        console.error("Newsletter Error:", err);
        req.flash('error', 'Lỗi đăng ký.');
        res.redirect('back');
    }
};

module.exports = {
    render,
    getHomePage,
    postContact,
    subscribeNewsletter,
};
