// services/user.service.js
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

async function createUserLocal({ email, password, fullName }) {
  // chuẩn hoá email
  email = String(email).toLowerCase().trim();

  // đã tồn tại?
  const existed = await User.findOne({ email });
  if (existed) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email, passwordHash, fullName, roles: ['customer']
  });

  // Không trả passwordHash ra ngoài
  return { id: user._id, email: user.email, fullName: user.fullName, roles: user.roles };
}

module.exports = { createUserLocal };
