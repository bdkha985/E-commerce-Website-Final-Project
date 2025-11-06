// seeders/discount.seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Discount = require('../models/discount.model'); // Đường dẫn tới model

async function seedDiscounts() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected MongoDB for discount seeding');

    await Discount.deleteMany({});
    console.log('🧹 Cleared old discounts');

    const discounts = [
        {
            code: 'SALEK', // 5 ký tự
            discountValue: 50000, // Giảm 50.000 VND
            usageLimit: 10,
            usageCount: 0 
        },
        {
            code: 'USEDX', // 5 ký tự
            discountValue: 10000, // Giảm 10.000 VND
            usageLimit: 10,
            usageCount: 10 // Hết lượt
        },
        {
            code: 'HELLO', 
            discountValue: 20000,
            usageLimit: 5,
            usageCount: 1 
        }
    ];

    await Discount.insertMany(discounts);
    console.log(`✅ Seeded ${discounts.length} discount codes`);

    await mongoose.disconnect();
    console.log('👋 Done seeding discounts!');
}

seedDiscounts().catch(err => {
    console.error('❌ Discount seed error:', err);
    process.exit(1);
});