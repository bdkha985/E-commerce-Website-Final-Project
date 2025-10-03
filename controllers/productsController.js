// controllers/productsController.js
const Product = require('../models/product.model');

/**
 * GET /products
 * Danh sách sản phẩm (có phân trang & filter cơ bản qua query)
 *  - ?q=keyword
 *  - ?page=1&limit=12
 */
const list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip  = (page - 1) * limit;

    const cond = {};
    if (req.query.q) {
      const kw = String(req.query.q).trim();
      cond.$or = [
        { name:  { $regex: kw, $options: 'i' } },
        { slug:  { $regex: kw, $options: 'i' } },
        { tags:  { $regex: kw, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Product
        .find(cond)
        .select('name slug images basePrice ratingAvg ratingCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(cond)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.render('layouts/main', {
      title: 'Products',
      body: 'pages/products',   // views/pages/products.ejs
      products: items,
      pagination: { page, limit, total, totalPages, q: req.query.q || '' }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/:slug
 * Chi tiết sản phẩm theo slug
 */
const detail = async (req, res, next) => {
  try {
    const slug = decodeURIComponent(req.params.slug || '').trim();
    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return res.status(404).render('layouts/main', {
        title: 'Không tìm thấy sản phẩm',
        body: 'pages/404', // đảm bảo có views/pages/404.ejs
        message: 'Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh.'
      });
    }

    // Gợi ý: related cùng brand (nếu có), fallback theo createdAt
    const related = await Product.find({
      _id: { $ne: product._id },
      ...(product.brandId ? { brandId: product.brandId } : {})
    })
      .select('name slug images basePrice')
      .sort(product.brandId ? { createdAt: -1 } : { createdAt: -1 })
      .limit(4)
      .lean();

    return res.render('layouts/main', {
      title: product.name,
      body: 'pages/product-detail', // views/pages/product-detail.ejs
      product,
      related
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, detail };
