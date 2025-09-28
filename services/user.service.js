const User = require('../models/user.model');
const bcrypt = require('bcrypt');

async function createUserLocal({ email, password, fullName }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error('Email đã được sử dụng');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    roles: ['customer'],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return await user.save();
}

async function findUserByEmail(email) {
  return await User.findOne({ email: String(email).toLowerCase().trim() });
}

async function validatePassword(user, password) {
  if (!user?.passwordHash) return false;
  try {
    return await bcrypt.compare(password, user.passwordHash);
  } catch {
    return false;
  }
}

module.exports = { 
  createUserLocal, 
  findUserByEmail,
  validatePassword };
