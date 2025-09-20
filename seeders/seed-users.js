require('dotenv').config();
const { connectDB } = require('../config/database');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcrypt');

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    await User.deleteMany({}); // cẩn thận: xoá toàn bộ USERS (chỉ dùng khi dev)

    const adminPass = await bcrypt.hash('Admin@123', 10);
    const customerPass = await bcrypt.hash('User@123', 10);

    const [admin, customer, oauthUser] = await User.create([
      {
        email: 'admin@kshop.com',
        passwordHash: adminPass,
        fullName: 'K Admin',
        roles: ['admin'],
        addresses: [{
          label: 'Nhà',
          fullName: 'K Admin',
          phone: '0900000001',
          street: '123 Nguyễn Trãi',
          ward: 'P.1',
          district: 'Q.5',
          city: 'TP.HCM',
          isDefault: true
        }],
        loyaltyPoints: { balance: 0, lastUpdatedAt: new Date() }
      },
      {
        email: 'user@kshop.com',
        passwordHash: customerPass,
        fullName: 'K Customer',
        roles: ['customer'],
        addresses: [{
          label: 'Công ty',
          fullName: 'K Customer',
          phone: '0900000002',
          street: '45 Lý Thường Kiệt',
          ward: 'P.7',
          district: 'Q.10',
          city: 'TP.HCM',
          isDefault: true
        }],
        loyaltyPoints: { balance: 12000, lastUpdatedAt: new Date() }
      },
      {
        email: 'oauth-only@kshop.com',
        passwordHash: null,
        fullName: 'K OAuth',
        roles: ['customer'],
        oauth: { googleId: 'google-1234567890' },
        addresses: [],
        loyaltyPoints: { balance: 0, lastUpdatedAt: new Date() }
      }
    ]);

    console.log('✅ Seed users done:', {
      admin: admin.email,
      customer: customer.email,
      oauth: oauthUser.email
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
  }
})();
