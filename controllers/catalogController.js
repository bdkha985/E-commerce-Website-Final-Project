// controllers/catalogController.js

const Product  = require('../models/product.model');
const Category = require('../models/category.model');
const Brand    = require('../models/brand.model');

function getDisplayPrice(p) {
  if (Array.isArray(p.variants) && p.variants.length) {
    const prices = p.variants.map(v => v.price).filter(n => typeof n === 'number');
    if (prices.length) return Math.min(...prices);
  }
  return typeof p.basePrice === 'number' ? p.basePrice : 0;
}

// Trang theo category
const categoryPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      return res.status(404).render('layouts/main', {
        title: '404 - Not Found',
        body: 'pages/404',
        message: 'Category không tồn tại'
      });
    }

    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip  = (page - 1) * limit;

    // filter brand, price...
    const brandSlug = req.query.brand || '';
    const pmin = req.query.pmin ? parseInt(req.query.pmin, 10) : null;
    const pmax = req.query.pmax ? parseInt(req.query.pmax, 10) : null;
    const sortQ = req.query.sort || 'newest';

    const where = { categoryIds: category._id };
    if (brandSlug) {
      const b = await Brand.findOne({ slug: brandSlug }).select('_id').lean();
      if (b) where.brandId = b._id;
    }

    let sort = { createdAt: -1 };
    if (sortQ === 'price_asc')  sort = { 'variants.price': 1, basePrice: 1 };
    if (sortQ === 'price_desc') sort = { 'variants.price': -1, basePrice: -1 };

    const [items, total, brands] = await Promise.all([
      Product.find(where).populate('brandId','name slug').sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(where),
      Brand.find().select('name slug').lean()
    ]);

    // filter pmin/pmax
    const filtered = items.filter(p => {
      const price = getDisplayPrice(p);
      if (pmin !== null && price < pmin) return false;
      if (pmax !== null && price > pmax) return false;
      return true;
    });

    const pageCount = Math.max(1, Math.ceil(total / limit));

    return res.render('layouts/main', {
      title: category.name,
      body: 'pages/catalog/category',
      category,
      brands,
      children: [],
      products: filtered,
      page,
      pageCount,
      query: { brand: brandSlug, pmin: pmin || '', pmax: pmax || '', sort: sortQ }
    });
  } catch (err) {
    next(err);
  }
};

// Trang "tất cả sản phẩm"
const allProductsPage = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip  = (page - 1) * limit;

    const brandSlug = req.query.brand || '';
    const pmin = req.query.pmin ? parseInt(req.query.pmin, 10) : null;
    const pmax = req.query.pmax ? parseInt(req.query.pmax, 10) : null;
    const sortQ = req.query.sort || 'newest';

    const where = {};
    if (brandSlug) {
      const b = await Brand.findOne({ slug: brandSlug }).select('_id').lean();
      if (b) where.brandId = b._id;
    }

    let sort = { createdAt: -1 };
    if (sortQ === 'price_asc')  sort = { 'variants.price': 1, basePrice: 1 };
    if (sortQ === 'price_desc') sort = { 'variants.price': -1, basePrice: -1 };

    const [items, total, brands] = await Promise.all([
      Product.find(where).populate('brandId','name slug').sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(where),
      Brand.find().select('name slug').lean()
    ]);

    const filtered = items.filter(p => {
      const price = getDisplayPrice(p);
      if (pmin !== null && price < pmin) return false;
      if (pmax !== null && price > pmax) return false;
      return true;
    });

    const pageCount = Math.max(1, Math.ceil(total / limit));

    return res.render('layouts/main', {
      title: 'Tất cả sản phẩm',
      body: 'pages/catalog/all',
      category: { name: 'Tất cả sản phẩm', slug: 'all' },
      brands,
      children: [],
      products: filtered,
      page,
      pageCount,
      query: { brand: brandSlug, pmin: pmin || '', pmax: pmax || '', sort: sortQ }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { categoryPage, allProductsPage };
