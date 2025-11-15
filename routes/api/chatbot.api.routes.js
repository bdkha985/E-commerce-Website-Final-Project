// routes/api/chatbot.api.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/api/chatbot.api.controller');

router.post('/query', ctrl.handleQuery);

module.exports = router;