// routes/admin/users.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/admin.user.controller');

// GET /admin/users (Danh sách user)
router.get('/', ctrl.listUsers);

// GET /admin/users/:id (Hiển thị form Sửa)
router.get('/:id', ctrl.getUserForm);

// POST /admin/users/:id/save (Xử lý Sửa)
router.post('/:id/save', ctrl.saveUser);

// POST /admin/users/:id/toggle-ban (Ban hoặc Unban)
router.post('/:id/toggle-ban', ctrl.toggleBanStatus);

module.exports = router;