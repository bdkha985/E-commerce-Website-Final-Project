const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/user.model');

const {test, render} = require('../controllers/homeController')
const products = require('../controllers/productsController')
const { signup, signin } = require('../controllers/authController');
const { signupRules, signinRules, handleValidation } = require('../middlewares/authValidator');

const router = express.Router();

router.get('/homepage', (req, res) => 
    render(res, 'pages/index.ejs',   { title: 'Trang chủ' })
);

router.get('/', test)
// router.get('/products', (req,res) => 
//     render(res, 'pages/products', {title: 'Products'})
//     );

// Auth
router.get('/signin',  (req, res) => 
    render(res, 'pages/auth/signin',  { title: 'Sign In' })
);
router.post('/signin', signinRules, handleValidation, signin);

router.get('/signup',  (req, res) => 
    render(res, 'pages/auth/signup',  { title: 'Sign Up' })
);
router.post('/signup', signupRules, handleValidation, signup);

router.get('/forgot',  (req, res) => 
    render(res, 'pages/auth/forgot',  { title: 'Forgot Password' })
);

// Products list & detail
router.get('/products', products.list);
router.get('/products/:slug', products.detail);

// Blog
router.get('/blog', (req, res) =>
  render(res, 'pages/blog', { title: 'Blog' })
);

// Contact us
router.get('/contact', (req, res) =>
  render(res, 'pages/contact', { title: 'Contact Us' })
);

// About us
router.get('/about', (req, res) =>
  render(res, 'pages/about', { title: 'About Us' })
);

// Cart
router.get('/cart', (req, res) =>
  render(res, 'pages/cart', { title: 'Cart' })
);

// === Sign in (POST) dành cho FORM EJS, không trả JSON ===
router.post('/signin', async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    if (!user || !user.passwordHash) {
      req.flash('error', 'Email hoặc mật khẩu sai');
      return res.redirect('/signin');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      req.flash('error', 'Email hoặc mật khẩu sai');
      return res.redirect('/signin');
    }

    // set session cho web
    req.session.userId  = user._id.toString();
    req.session.fullName = user.fullName;
    req.session.role     = (user.roles || []).includes('admin') ? 'admin' : 'customer';

    // remember me (tuỳ chọn): kéo dài phiên
    if (remember) req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 ngày

    req.flash('success', 'Đăng nhập thành công');
    return res.redirect('/homepage');
  } catch (e) {
    next(e);
  }
});

// === Logout ===
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/homepage'));
});
module.exports = router;