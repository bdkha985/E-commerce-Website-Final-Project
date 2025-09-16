const express = require('express');

const {getHomePage, getABC, duykh4} = require('../controllers/homeController')
const router = express.Router();

router.get('/', getHomePage)
router.get('/test', getABC)
router.get('/duykh4', duykh4)

module.exports = router;