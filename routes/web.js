const express = require('express');

const {getHomePage, render} = require('../controllers/homeController')
const products = require('../controllers/productsController')
const router = express.Router();

router.get('/homepage', (req, res) => render(res, 'pages/index.ejs',   { title: 'Trang chủ' }));

router.get('/', getHomePage)
// router.get('/products', (req,res) => 
//     render(res, 'pages/products', {title: 'Products'})
//     );
// products list & detail
router.get('/products', products.list);
router.get('/products/:slug', products.detail);

module.exports = router;