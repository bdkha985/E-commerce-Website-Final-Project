// seeds/catalog.seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { syncProductsToES } = require('../services/search/elastic.service'); 

// === KHO ẢNH THỰC TẾ TỪ UNSPLASH (Đã lọc theo danh mục) ===
const CATEGORY_IMAGES = {
    'ao-nam': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80', // Áo thun trắng
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80', // Áo thun nam
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80', // Áo phông
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80', // Áo thun đen
    ],
    'quan-nam': [
        'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=800&q=80', // Quần Jean xanh
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', // Jean tối màu
        'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&w=800&q=80', // Chồng quần Jean
    ],
    'dam-nu': [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', // Đầm hoa
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80', // Đầm trắng
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80', // Váy hoa nhí
    ],
    'sneaker': [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', // Giày trắng
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80', // Sneaker Nike
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80', // Giày thể thao
        'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80', // Giày
    ],
    'tui-xach': [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', // Túi nâu
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80', // Túi xám
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80', // Túi thời trang
    ],
    'that-lung': [
        'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80', // Thắt lưng da
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', // Thắt lưng cuộn
    ],
    'phu-kien': [ // Dùng cho Nón
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80', // Nón kết
        'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80', // Nón trên bàn
    ]
};

// Hàm lấy ảnh ngẫu nhiên từ kho theo danh mục
function getImagesForCategory(categorySlug, count = 3) {
    if (CATEGORY_IMAGES[categorySlug]) {
        const pool = CATEGORY_IMAGES[categorySlug];
        return pool.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    return [
        `https://placehold.co/800x800?text=${categorySlug}-1`,
        `https://placehold.co/800x800?text=${categorySlug}-2`,
        `https://placehold.co/800x800?text=${categorySlug}-3`
    ];
}

function s(str) {
  return slugify(str, { lower: true, strict: true });
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genSku(prefix = 'SKU') {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getCombinations(options) {
  const keys = Object.keys(options);
  if (!keys.length) return [{}];

  const result = [];
  const [currentKey, ...remainingKeys] = keys;
  const currentValues = options[currentKey];
  
  const remainingCombinations = getCombinations(
    remainingKeys.reduce((acc, key) => {
      acc[key] = options[key];
      return acc;
    }, {})
  );

  for (const value of currentValues) {
    for (const combo of remainingCombinations) {
      result.push({ [currentKey]: value, ...combo });
    }
  }
  return result;
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
  const parentCategories = await Category.insertMany([
    { name: 'Nam', slug: 'nam' },
    { name: 'Nữ', slug: 'nu' },
    { name: 'Giày dép', slug: 'giay-dep' },
    { name: 'Phụ kiện', slug: 'phu-kien' },
  ]);

  const catMap = parentCategories.reduce((acc, c) => {
    acc[c.slug] = c._id;
    return acc;
  }, {});

  const subCategories = await Category.insertMany([
    { name: 'Áo Nam', slug: 'ao-nam', parentId: catMap['nam'] },
    { name: 'Quần Nam', slug: 'quan-nam', parentId: catMap['nam'] },
    { name: 'Áo Nữ', slug: 'ao-nu', parentId: catMap['nu'] },
    { name: 'Đầm Nữ', slug: 'dam-nu', parentId: catMap['nu'] },
    { name: 'Sneaker', slug: 'sneaker', parentId: catMap['giay-dep'] },
    { name: 'Túi xách', slug: 'tui-xach', parentId: catMap['phu-kien'] },
    { name: 'Thắt lưng', slug: 'that-lung', parentId: catMap['phu-kien'] },
  ]);

  subCategories.forEach(c => (catMap[c.slug] = c._id));
  console.log(`✅ Seeded ${parentCategories.length + subCategories.length} categories`);

  // ====== Helper tạo 1 product ======
  const makeProduct = ({
    name,
    basePrice,
    categorySlug,
    brandId,
    tags = [],
    variantOptions = {} 
  }) => {
    
    // Lấy 3 ảnh chính
    const images = getImagesForCategory(categorySlug, 3);
    
    const variants = [];
    const combinations = getCombinations(variantOptions);

    if (combinations.length > 0) {
      for (const combo of combinations) {
        const comboName = Object.values(combo).join('-');
        const stock = Math.random() < 0.2 ? 0 : rand(10, 50);

        const variantImages = getImagesForCategory(categorySlug, 1);

        variants.push({
          ...combo, 
          sku: genSku('VAR-' + comboName),
          price: basePrice + rand(-10000, 20000),
          stock: stock,
          images: variantImages
        });
      }
    }

    return {
      name,
      slug: s(name),
      brandId: brandId,
      categoryIds: [catMap[categorySlug]],
      shortDesc: `Mô tả ngắn cho ${name}. Sản phẩm chất lượng cao, thiết kế hiện đại.`,
      longDesc: `Chi tiết sản phẩm ${name}.\n- Chất liệu cao cấp.\n- Thiết kế chuẩn form.\n- Phù hợp nhiều phong cách.\n\nHướng dẫn bảo quản:\n- Giặt ở nhiệt độ thường.\n- Tránh chất tẩy mạnh.`,
      images, 
      basePrice, 
      variants, 
      ratingAvg: +(Math.random() * 2 + 3).toFixed(1),
      ratingCount: rand(10, 500),
      tags: tags,
    };
  };

  const products = [];
  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Navy'];
  const shoeSizes = ['39', '40', '41', '42'];

  // 1. Áo thun
  for (let i = 1; i <= 10; i++) {
    products.push(makeProduct({
      name: `Áo Thun Nam Cổ Tròn #${i}`,
      basePrice: 199000,
      categorySlug: 'ao-nam',
      brandId: brandIds[i % brandIds.length],
      tags: i === 1 ? ['best-seller'] : [],
      variantOptions: { color: colors, size: sizes }
    }));
  }

  // 2. Quần Jeans
  for (let i = 1; i <= 8; i++) {
    products.push(makeProduct({
      name: `Quần Jeans Nam Skinny #${i}`,
      basePrice: 499000,
      categorySlug: 'quan-nam',
      brandId: brandIds[i % brandIds.length],
      tags: i === 1 ? ['new'] : [],
      variantOptions: { color: ['Blue', 'Black', 'Gray'], size: ['28', '29', '30', '31', '32'] }
    }));
  }

  // 3. Đầm Nữ
  for (let i = 1; i <= 8; i++) {
    products.push(makeProduct({
      name: `Đầm Voan Nữ Hoa Nhí #${i}`,
      basePrice: 599000,
      categorySlug: 'dam-nu',
      brandId: brandIds[i % brandIds.length],
      variantOptions: { color: ['Red', 'Yellow', 'White'], size: ['S', 'M', 'L'] }
    }));
  }

  // 4. Sneaker
  for (let i = 1; i <= 6; i++) {
    products.push(makeProduct({
      name: `Giày Sneaker Cổ Thấp #${i}`,
      basePrice: 799000,
      categorySlug: 'sneaker',
      brandId: brandIds[i % brandIds.length],
      tags: i === 1 ? ['best-seller'] : [],
      variantOptions: { color: ['White', 'Black', 'Beige'], size: shoeSizes }
    }));
  }

  // 5. Túi xách
  for (let i = 1; i <= 5; i++) {
    products.push(makeProduct({
      name: `Túi Đeo Chéo Nữ #${i}`,
      basePrice: 349000,
      categorySlug: 'tui-xach',
      brandId: brandIds[i % brandIds.length],
      variantOptions: { color: ['Black', 'Brown', 'Beige'] }
    }));
  }

  // 6. Thắt lưng
  for (let i = 1; i <= 5; i++) {
    products.push(makeProduct({
      name: `Thắt Lưng Da Nam #${i}`,
      basePrice: 249000,
      categorySlug: 'that-lung',
      brandId: brandIds[i % brandIds.length],
      variantOptions: { size: ['80cm', '90cm', '100cm'] }
    }));
  }
  
  // 7. Nón (Phụ kiện)
  products.push(makeProduct({
      name: `Nón Kết Trơn`,
      basePrice: 149000,
      categorySlug: 'phu-kien',
      brandId: brandIds[0],
      variantOptions: {} 
  }));

  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products`);

  // Gọi đồng bộ sang ES
  await syncProductsToES();

  await mongoose.disconnect();
  console.log('👋 Done!');
}

main().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});