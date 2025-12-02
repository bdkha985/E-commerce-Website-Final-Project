// routes/api/chatbot.api.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/api/chatbot.api.controller");
const { chatbotRules } = require("../../middlewares/featureValidator");
const { handleApiValidation } = require("../../middlewares/authValidator");

router.post("/query", chatbotRules, handleApiValidation, ctrl.handleQuery);

module.exports = router;
