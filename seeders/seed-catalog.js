// seeders/seed-catalog.js
require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const [nike] = await Brand.create([{ name: 'Nike' }]);
  const [men, shirts] = await Category.create([
    { name: 'Men', parentId: null },
    { name: 'Shirts', parentId: null }
  ]);

  await Product.create([
    {
      name: 'Áo thun Regular',
      brandId: nike._id,
      categoryIds: [men._id, shirts._id],
      shortDesc: 'Cotton 230GSM',
      images: ['https://picsum.photos/seed/x1/800/600'],
      basePrice: 199000,
      variants: [
        { sku: 'TSHIRT-WHITE-M', color: 'White', size: 'M', price: 199000, stock: 20 }
      ]
    }
  ]);

  console.log('✅ Seed done');
  await mongoose.disconnect();
})();
