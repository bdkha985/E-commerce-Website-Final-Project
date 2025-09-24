// routes/auth.api.js
const express = require('express');
const { body } = require('express-validator');
const { signup } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  [
    body('fullName')
      .trim().notEmpty().withMessage('Full name is required')
      .isLength({ min: 2 }).withMessage('Full name is too short'),
    body('email')
      .trim().isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  ],
  signup
);

module.exports = router;
