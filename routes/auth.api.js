// routes/auth.api.js
const express = require('express');
const { body } = require('express-validator');
const { apiSignin, apiSignup } = require('../controllers/authApiController');
const { signupRules, signinRules, handleValidation } = require('../middlewares/authValidator');

const router = express.Router();

router.post('/signup', signupRules, apiSignup);
router.post('/signin', signinRules, apiSignin);

module.exports = router;
