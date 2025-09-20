// services/user.service.js
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

async function createUserLocal({ email, password, fullName, roles = ['customer'] }) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    roles,
    loyaltyPoints: { balance: 0, lastUpdatedAt: new Date() }
  });
  return user.toObject();
}

async function createUserOAuth({ email, fullName, provider, providerId }) {
  const oauthField = provider === 'google' ? { googleId: providerId } : { facebookId: providerId };
  const user = await User.create({
    email,
    passwordHash: null,
    fullName,
    roles: ['customer'],
    oauth: oauthField,
    loyaltyPoints: { balance: 0, lastUpdatedAt: new Date() }
  });
  return user.toObject();
}

async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).lean();
}

async function addAddress(userId, address, setDefault = false) {
  const user = await User.findById(userId);
  if (!user) return null;

  const addr = { ...address, isDefault: !!setDefault };
  if (setDefault) {
    user.addresses = user.addresses.map(a => ({ ...a.toObject?.() ?? a, isDefault: false }));
  }
  user.addresses.push(addr);
  await user.save();
  return user.toObject();
}

async function updateLoyalty(userId, delta) {
  const user = await User.findById(userId);
  if (!user) return null;
  user.loyaltyPoints.balance = Math.max(0, (user.loyaltyPoints.balance || 0) + delta);
  user.loyaltyPoints.lastUpdatedAt = new Date();
  await user.save();
  return user.toObject();
}

module.exports = {
  createUserLocal,
  createUserOAuth,
  findByEmail,
  addAddress,
  updateLoyalty
};
