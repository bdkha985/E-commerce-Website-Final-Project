const Product = require("../../models/product.model");

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
        const [bestSellers, newCollection] = await Promise.all([
            Product.find()
                .sort({ ratingCount: -1, ratingAvg: -1, createdAt: -1 })
                .limit(5)
                .lean(),
            Product.find().sort({ createdAt: -1 }).limit(5).lean(),
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
            bestSellers: mapView(bestSellers),
            newCollection: mapView(newCollection),
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    render,
    getHomePage,
};
