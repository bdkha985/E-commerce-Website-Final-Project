const express = require('express');

const {test, render} = require('../controllers/homeController')
const products = require('../controllers/productsController')
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
router.get('/signup',  (req, res) => 
    render(res, 'pages/auth/signup',  { title: 'Sign Up' })
);
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

//Contact us
router.get('/contact', (req, res) =>
  render(res, 'pages/contact', { title: 'Contact Us' })
);

//About us
router.get('/about', (req, res) =>
  render(res, 'pages/about', { title: 'About Us' })
);

//Cart

router.get('/cart', (req, res) =>
  render(res, 'pages/cart', { title: 'Cart' })
);


module.exports = router;