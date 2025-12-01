// seeders/seed-users.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

async function seedUsers() {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding users');

        // 3. Tạo Hash Password (chung cho tất cả là '123456')
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        // 4. Danh sách User mẫu
        const users = [
            {
                fullName: 'Admin K Shopping',
                email: 'admin@kshop.com',
                passwordHash: passwordHash,
                roles: ['admin'], // Quyền quản trị
                phone: '0909123456',
                addresses: [
                    { label: 'Văn phòng', street: '19 Nguyễn Hữu Thọ', ward: 'Tân Phong', city: 'Hồ Chí Minh', isDefault: true }
                ]
            },
            {
                fullName: 'Khách Hàng Mẫu',
                email: 'customer@kshop.com',
                passwordHash: passwordHash,
                roles: ['customer'], // Quyền khách hàng
                phone: '0909999999',
                addresses: [
                    { label: 'Nhà riêng', street: '123 Đường số 1', ward: 'Bình Hưng Hòa', city: 'Hồ Chí Minh', isDefault: true }
                ]
            }
        ];

        // 5. Lưu vào DB
        await User.insertMany(users);
        console.log(`✅ Seeded ${users.length} users successfully`);
        console.log('👉 Admin: admin@kshop.com / 123456');
        console.log('👉 Customer: customer@kshop.com / 123456');

    } catch (error) {
        console.error('❌ Seed users failed:', error);
    } finally {
        // 6. Ngắt kết nối
        await mongoose.disconnect();
        console.log('👋 Disconnected');
        process.exit();
    }
}

seedUsers();