// seeds/catalog.seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { syncProductsToES } = require('../services/search/elastic.service');

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

  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
  ]);
  console.log('🧹 Cleared old data');

  const brandNames = ['K Classic', 'Urban Ride', 'S-Line', 'NovaWear', 'Monochrome'];
  const brands = await Brand.insertMany(
    brandNames.map(name => ({ name, slug: s(name) }))
  );
  const brandIds = brands.map(b => b._id);
  console.log(`✅ Seeded ${brands.length} brands`);

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

  const makeProduct = ({
    name,
    basePrice,
    categorySlug,
    brandId,
    seedKey,
    tags = [],
    variantOptions = {}
  }) => {
    
    const images = [
      `https://picsum.photos/seed/${seedKey}a/800/800`,
      `https://picsum.photos/seed/${seedKey}b/800/800`,
      `https://picsum.photos/seed/${seedKey}c/800/800`,
    ];
    
    const variants = [];
    const combinations = getCombinations(variantOptions);

    if (combinations.length > 0) {
      for (const combo of combinations) {
        const comboName = Object.values(combo).join('-');
        
        const stock = Math.random() < 0.2 ? 0 : rand(10, 50);

        variants.push({
          ...combo, 
          sku: genSku(seedKey.toUpperCase() + '-' + comboName),
          price: basePrice + rand(-10000, 20000),
          stock: stock,
          images: [
            `https://picsum.photos/seed/${seedKey}${comboName}/800/800`
          ]
        });
      }
    }

    return {
      name,
      slug: s(name),
      brandId: brandId,
      categoryIds: [catMap[categorySlug]],
      shortDesc: `Mô tả ngắn cho ${name}. Đây là một sản phẩm chất lượng cao với thiết kế hiện đại, phù hợp với mọi phong cách.`,
      longDesc: `Mô tả dài cho ${name}.\nChất liệu: 100% Cotton thoáng mát.\nSản xuất tại Việt Nam.\nHướng dẫn bảo quản:\n- Giặt ở nhiệt độ thường.\n- Không sử dụng chất tẩy.\n- Phơi ở nơi khô ráo, thoáng mát.\nCam kết hàng chính hãng.`,
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

  for (let i = 1; i <= 10; i++) {
    products.push(makeProduct({
      name: `Áo Thun Nam Cổ Tròn #${i}`,
      basePrice: 199000,
      categorySlug: 'ao-nam',
      brandId: brandIds[i % brandIds.length],
      seedKey: `tshirt${i}`,
      tags: i === 1 ? ['best-seller'] : [],
      variantOptions: {
        color: colors,
        size: sizes
      }
    }));
  }

  for (let i = 1; i <= 8; i++) {
    products.push(makeProduct({
      name: `Quần Jeans Nam Skinny #${i}`,
      basePrice: 499000,
      categorySlug: 'quan-nam',
      brandId: brandIds[i % brandIds.length],
      seedKey: `jeans${i}`,
      tags: i === 1 ? ['new'] : [],
      variantOptions: {
        color: ['Blue', 'Black', 'Gray'],
        size: ['28', '29', '30', '31', '32']
      }
    }));
  }

  for (let i = 1; i <= 8; i++) {
    products.push(makeProduct({
      name: `Đầm Voan Nữ Hoa Nhí #${i}`,
      basePrice: 599000,
      categorySlug: 'dam-nu',
      brandId: brandIds[i % brandIds.length],
      seedKey: `dress${i}`,
      variantOptions: {
        color: ['Red', 'Yellow', 'White'],
        size: ['S', 'M', 'L']
      }
    }));
  }

  for (let i = 1; i <= 6; i++) {
    products.push(makeProduct({
      name: `Giày Sneaker Cổ Thấp #${i}`,
      basePrice: 799000,
      categorySlug: 'sneaker',
      brandId: brandIds[i % brandIds.length],
      seedKey: `sneaker${i}`,
      tags: i === 1 ? ['best-seller'] : [],
      variantOptions: {
        color: ['White', 'Black', 'Beige'],
        size: shoeSizes
      }
    }));
  }

  for (let i = 1; i <= 5; i++) {
    products.push(makeProduct({
      name: `Túi Đeo Chéo Nữ #${i}`,
      basePrice: 349000,
      categorySlug: 'tui-xach',
      brandId: brandIds[i % brandIds.length],
      seedKey: `bag${i}`,
      variantOptions: {
        color: ['Black', 'Brown', 'Beige']
      }
    }));
  }

  for (let i = 1; i <= 5; i++) {
    products.push(makeProduct({
      name: `Thắt Lưng Da Nam #${i}`,
      basePrice: 249000,
      categorySlug: 'that-lung',
      brandId: brandIds[i % brandIds.length],
      seedKey: `belt${i}`,
      variantOptions: {
        size: ['80cm', '90cm', '100cm']
      }
    }));
  }
  
  products.push(makeProduct({
      name: `Nón Kết Trơn`,
      basePrice: 149000,
      categorySlug: 'phu-kien',
      brandId: brandIds[0],
      seedKey: `hat1`,
      variantOptions: {}
  }));


  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products`);

    await syncProductsToES();
    
  await mongoose.disconnect();
  console.log('👋 Done!');
}

main().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});