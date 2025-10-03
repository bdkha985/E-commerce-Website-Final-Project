// seeds/catalog.seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

const Brand = require('../models/brand.model');
const Category = require('../models/category.model'); // bạn đang đặt file là "caterogy"
const Product = require('../models/product.model');

function s(str) {
  return slugify(str, { lower: true, strict: true });
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// tạo sku ngắn gọn
function genSku(prefix = 'SKU') {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected MongoDB');

  // Xóa dữ liệu cũ
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
  ]);
  console.log('🧹 Cleared old data');

  // ====== BRANDS ======
  const brandNames = ['K Classic', 'Urban Ride', 'S-Line', 'NovaWear', 'Monochrome'];
  const brands = await Brand.insertMany(
    brandNames.map(name => ({ name, slug: s(name) }))
  );
  const brandIds = brands.map(b => b._id);
  console.log(`✅ Seeded ${brands.length} brands`);

  // ====== CATEGORIES ======
  const catData = [
    { name: 'Nam', slug: 'men' },
    { name: 'Nữ', slug: 'women' },
    { name: 'Giày dép', slug: 'shoes' },
    { name: 'Phụ kiện', slug: 'accessories' },
  ];
  const categories = await Category.insertMany(catData);
  const catMap = {};
  categories.forEach(c => (catMap[c.slug] = c._id));
  console.log(`✅ Seeded ${categories.length} categories`);

  // Helper tạo 1 product “đủ chất”
  const makeProduct = ({ name, base, catSlug, brand, seedKey, tag = [] }) => {
    const basePrice = base + rand(-20000, 80000);
    const images = [
      `https://picsum.photos/seed/${seedKey}a/800/800`,
      `https://picsum.photos/seed/${seedKey}b/800/800`,
    ];
    const variants = [
      {
        sku: genSku('BLK'),
        color: 'Black',
        size: 'M',
        price: basePrice,
        stock: rand(5, 50),
        images,
      },
      {
        sku: genSku('WHT'),
        color: 'White',
        size: 'L',
        price: basePrice + rand(0, 30000),
        stock: rand(5, 50),
        images,
      },
    ];

    return {
      name,
      slug: s(name),
      brandId: brand,
      categoryIds: [catMap[catSlug]],
      shortDesc: `${name} – chất liệu thoáng mát, dễ phối.`,
      longDesc:
        'Chất vải thân thiện làn da, form dễ mặc, phù hợp nhiều phong cách thường nhật. Sản phẩm sản xuất theo tiêu chuẩn QC nội bộ.',
      images,
      basePrice,
      variants,
      ratingAvg: +(Math.random() * 2 + 3).toFixed(1), // 3.0–5.0
      ratingCount: rand(10, 500),
      tags: tag,
    };
  };

  // ====== PRODUCTS MẪU ======
  const fixedProducts = [
    makeProduct({ name: 'Áo thun Regular Nam', base: 199000, catSlug: 'men', brand: brandIds[0], seedKey: 'men1', tag:['best'] }),
    makeProduct({ name: 'Áo sơ mi Trắng Nữ', base: 299000, catSlug: 'women', brand: brandIds[1], seedKey: 'women1' }),
    makeProduct({ name: 'Sneaker Basic', base: 499000, catSlug: 'shoes', brand: brandIds[2], seedKey: 'shoes1', tag:['new'] }),
    makeProduct({ name: 'Balo Laptop Chống Nước', base: 399000, catSlug: 'accessories', brand: brandIds[3], seedKey: 'acc1' }),
  ];

  // thêm ~36 sp random cho dễ test phân trang/lọc
  const randoms = [];
  for (let i = 1; i <= 12; i++) {
    randoms.push(
      makeProduct({
        name: `Áo thun nam #${i}`,
        base: 150000 + i * 2000,
        catSlug: 'men',
        brand: brandIds[rand(0, brandIds.length - 1)],
        seedKey: `men${i}`,
      })
    );
  }
  for (let i = 1; i <= 12; i++) {
    randoms.push(
      makeProduct({
        name: `Đầm nữ #${i}`,
        base: 250000 + i * 3000,
        catSlug: 'women',
        brand: brandIds[rand(0, brandIds.length - 1)],
        seedKey: `women${i}`,
      })
    );
  }
  for (let i = 1; i <= 6; i++) {
    randoms.push(
      makeProduct({
        name: `Giày sneaker #${i}`,
        base: 450000 + i * 5000,
        catSlug: 'shoes',
        brand: brandIds[rand(0, brandIds.length - 1)],
        seedKey: `shoes${i}`,
      })
    );
  }
  for (let i = 1; i <= 6; i++) {
    randoms.push(
      makeProduct({
        name: `Phụ kiện #${i}`,
        base: 120000 + i * 1000,
        catSlug: 'accessories',
        brand: brandIds[rand(0, brandIds.length - 1)],
        seedKey: `acc${i}`,
      })
    );
  }

  const products = [...fixedProducts, ...randoms];
  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products`);

  await mongoose.disconnect();
  console.log('👋 Done!');
}

main().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
