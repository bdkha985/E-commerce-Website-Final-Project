const { body, validationResult } = require('express-validator');

// Các rule cho signup
const signupRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage("Họ tên bắt buộc")
    .isLength({ min: 2 })
    .withMessage('Họ tên ít nhất 2 ký tự'),

  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),

  body('phone')
    .trim()
    .matches(/^0[0-9]{9}$/).withMessage("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)"),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu ít nhất 6 ký tự'),

    body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
];

// Các rule cho signin
const signinRules = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
];

// Middleware chung để bắt lỗi validate
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Ghép nhiều lỗi thành 1 chuỗi, cách nhau bằng dấu phẩy
    const msg = errors.array().map(e => e.msg).join(', ');
    req.flash('error', msg);
    return res.redirect('back'); // quay lại trang trước (signup hoặc signin)
  }
  next();
};

module.exports = { signupRules, signinRules, handleValidation };
