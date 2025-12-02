// routes/api/search.api.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/api/search.api.controller");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/search/suggest
router.get("/suggest", ctrl.getSuggestions);

// POST /api/search/image (Upload ảnh để tìm kiếm)
router.post("/image", upload.single("image"), ctrl.searchByImage);

module.exports = router;
