// routes/api/search.api.routes.js
const express = require('express');
const router = express.Router();
const searchApiController = require('../../controllers/api/search.api.controller');

// GET /api/search/suggest
router.get('/suggest', searchApiController.getSuggestions);

module.exports = router;