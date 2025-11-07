// controllers/api/search.api.controller.js
const Product = require('../../models/product.model');

// === Sao chép 2 hàm helper từ home.controller.js [cite: 327-329] ===
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
// === Hết 2 hàm helper ===

const getSuggestions = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        // Nếu query rỗng hoặc quá ngắn, trả về mảng rỗng
        if (q.length < 2) {
            return res.json({ ok: true, products: [] });
        }

        // Điều kiện tìm kiếm
        const cond = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
            ]
        };

        // Tìm kiếm và giới hạn 5 kết quả
        const items = await Product.find(cond)
            .select('name slug images basePrice variants') // Chọn các trường cần thiết
            .sort({ name: 1 }) // Sắp xếp theo tên
            .limit(5) 
            .lean();

        // Map lại dữ liệu cho gọn
        const products = items.map(p => ({
            name: p.name,
            slug: p.slug,
            thumb: getDisplayImage(p),
            price: getDisplayPrice(p)
        }));
        
        res.json({ ok: true, products });
    } catch (err) {
        res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
    }
};

module.exports = { getSuggestions };