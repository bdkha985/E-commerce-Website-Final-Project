// controllers/authController.js
const { validationResult } = require('express-validator');
const { createUserLocal } = require('../services/user.service');

const signup = async (req, res) => {
  // validate result
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { email, password, fullName } = req.body;
  const user = await createUserLocal({ email, password, fullName });

  // (tuỳ chọn) đăng nhập luôn sau khi đăng ký:
  // req.session.userId = user.id; req.session.role = 'customer';

  return res.status(201).json({ ok: true, user });
};

module.exports = { signup };
