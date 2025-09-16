// Demo data (sau thay bằng DB)
const PRODUCTS = [
  {
    id: 'p1',
    slug: 'mid-century-modern-tshirt',
    name: 'Mid Century Modern T-Shirt',
    price: 110000,
    category: 'Men - Clothes',
    rating: 5.0, reviews: 188,
    images: [
      'https://picsum.photos/seed/p1a/800/600',
      'https://picsum.photos/seed/p1b/800/600',
      'https://picsum.photos/seed/p1c/800/600'
    ],
    shortDesc: 'Áo thun cotton 230GSM, form regular.',
    longDesc: 'Chất liệu cotton dày dặn, thấm hút tốt. In lụa bền màu.'
  },
  {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  },
    {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  },
    {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  },
    {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  },
    {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  },
    {
    id: 'p2',
    slug: 'corporate-office-shoes',
    name: 'Corporate Office Shoes',
    price: 399000,
    category: 'Men - Shoes',
    rating: 5.0, reviews: 1020,
    images: [
      'https://picsum.photos/seed/p2a/800/600',
      'https://picsum.photos/seed/p2b/800/600'
    ],
    shortDesc: 'Giày da công sở cổ điển.',
    longDesc: 'Da thật chống xước, đế êm chống trượt.'
  }
];

const list = (req, res) => {
  res.render('layouts/main', {
    title: 'Products',
    body: 'pages/products',
    products: PRODUCTS
  });
};

const detail = (req, res) => {
  const { slug } = req.params;
  const product = PRODUCTS.find(p => p.slug === slug);
  if (!product) {
    return res.status(404).render('error.ejs', { message: 'Product not found' });
  }
  const related = PRODUCTS.filter(p => p.slug !== slug).slice(0, 4);
  res.render('layouts/main', {
    title: product.name,
    body: 'pages/product-detail',
    product,
    related
  });
};

module.exports = { list, detail, PRODUCTS };