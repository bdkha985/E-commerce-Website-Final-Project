// controllers/api/search.api.controller.js
const Product = require("../../models/product.model");
const { searchProducts } = require("../../services/search/elastic.service");
const {
    generateKeywordsFromImage,
} = require("../../services/ai/gemini.service");

function getDisplayImage(p) {
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    if (Array.isArray(p.variants) && p.variants[0]?.images?.length)
        return p.variants[0].images[0];
    return "https://placehold.co/80x80?text=No+Img";
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

// ========================================================
// Hàm tìm kiếm gốc của mongoDB
// ========================================================
// const getSuggestions = async (req, res) => {
//     try {
//         const q = (req.query.q || '').trim();
//         // Nếu query rỗng hoặc quá ngắn, trả về mảng rỗng
//         if (q.length < 2) {
//             return res.json({ ok: true, products: [] });
//         }

//         // Điều kiện tìm kiếm
//         const cond = {
//             $or: [
//                 { name: { $regex: q, $options: 'i' } },
//                 { tags: { $regex: q, $options: 'i' } },
//             ]
//         };

//         // Tìm kiếm và giới hạn 5 kết quả
//         const items = await Product.find(cond)
//             .select('name slug images basePrice variants') // Chọn các trường cần thiết
//             .sort({ name: 1 }) // Sắp xếp theo tên
//             .limit(5)
//             .lean();

//         // Map lại dữ liệu cho gọn
//         const products = items.map(p => ({
//             name: p.name,
//             slug: p.slug,
//             thumb: getDisplayImage(p),
//             price: getDisplayPrice(p)
//         }));

//         res.json({ ok: true, products });
//     } catch (err) {
//         res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
//     }
// };

const getSuggestions = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        if (q.length < 2) {
            return res.json({ ok: true, products: [] });
        }

        const products = await searchProducts(q);

        res.json({ ok: true, products: products.slice(0, 5) });
    } catch (err) {
        console.error("Lỗi getSuggestions (ES):", err);
        res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
    }
};

// 2. Image Search (AI)
const searchByImage = async (req, res) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ ok: false, message: "Vui lòng chọn ảnh." });
        }

        const keywords = await generateKeywordsFromImage(
            req.file.buffer,
            req.file.mimetype
        );

        if (!keywords) {
            return res
                .status(500)
                .json({ ok: false, message: "AI không nhận diện được ảnh." });
        }

        res.json({ ok: true, keywords });
    } catch (err) {
        console.error("Lỗi searchByImage:", err);
        res.status(500).json({ ok: false, message: "Lỗi xử lý ảnh." });
    }
};

module.exports = {
    getSuggestions,
    searchByImage,
};
