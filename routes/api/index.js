const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.api.routes'));
router.use('/auth', require('./passwordRecovery.api.routes')); // Vẫn mount /auth
router.use('/account', require('./account.api.routes'));
router.use('/cart', require('./cart.api.routes'));
router.use('/checkout', require('./checkout.api.routes'));
router.use('/search', require('./search.api.routes.js'));
router.use('/reviews', require('./review.api.routes.js'));
router.use('/chatbot', require('./chatbot.api.routes.js')); // <-- THÊM DÒNG NÀY

module.exports = router;