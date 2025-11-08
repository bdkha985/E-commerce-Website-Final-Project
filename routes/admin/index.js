// routes/admin/index.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboard.controller');
const dashboardApiController = require('../../controllers/admin/admin.dashboard.api.controller');

// GET /admin (Dashboard)
router.get('/', dashboardController.getDashboard);
router.get('/api/chart-data', dashboardApiController.getChartData);

// (Sau này chúng ta sẽ thêm các route khác vào đây)
router.use('/orders', require('./orders.routes'));
router.use('/products', require('./products.routes'));
router.use('/users', require('./users.routes'));
router.use('/discounts', require('./discounts.routes'));

module.exports = router;