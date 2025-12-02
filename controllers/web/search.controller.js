// controllers/web/search.controller.js

const Product = require("../../models/product.model");
const { searchProducts } = require("../../services/search/elastic.service");
const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

// const getResults = async (req, res, next) => {
//     try {
//         const q = (req.query.q || '').trim();
//         const page = Math.max(1, parseInt(req.query.page || '1', 10));
//         const limit = 16; // 16 sản phẩm mỗi trang
//         const skip = (page - 1) * limit;

//         const cond = {};
//         if (q) {
//             cond.$or = [
//                 { name: { $regex: q, $options: 'i' } },
//                 { slug: { $regex: q, $options: 'i' } },
//                 { tags: { $regex: q, $options: 'i' } },
//             ];
//         }

//         const [items, total] = await Promise.all([
//             Product.find(cond)
//                 .populate('brandId', 'name') // Populate brand để _product-card hiển thị
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean(),
//             Product.countDocuments(cond)
//         ]);

//         const totalPages = Math.max(1, Math.ceil(total / limit));

//         // Map lại dữ liệu để partial _product-card có thể đọc
//         const products = (items || []).map((p) => ({
//             ...p,
//             _thumb: getDisplayImage(p),
//             _price: getDisplayPrice(p),
//         }));

//         res.render('layouts/main', {
//             title: `Tìm kiếm: "${q}"`,
//             body: 'pages/search-results', // View mới sắp tạo
//             products: products,
//             q: q,
//             pagination: { page, totalPages, total, q }
//         });

//     } catch (err) {
//         next(err);
//     }
// };

const getResults = async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = 16;

        let items = [];
        let total = 0;

        if (q) {
            const allResults = await searchProducts(q);

            total = allResults.length;
            const skip = (page - 1) * limit;
            items = allResults.slice(skip, skip + limit);
        }

        const totalPages = Math.max(1, Math.ceil(total / limit));

        const products = items.map((p) => ({
            ...p,
            _thumb: p.thumb,
            _price: p.price,
        }));

        res.render("layouts/main", {
            title: `Tìm kiếm: "${q}"`,
            body: "pages/search-results",
            products: products,
            q: q,
            pagination: { page, totalPages, total, q },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getResults };
