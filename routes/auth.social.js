const router = require('express').Router();
const passport = require('passport');

// Google login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
    req.flash('success', 'Đăng nhập bằng Google thành công');
    res.redirect('/homepage');
  }
);

// Facebook login
router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile','email'], authType: 'rerequest' })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/signin',
    failureFlash: true
  }),
  (req, res) => {
    req.flash('success', 'Đăng nhập bằng Facebook thành công');
    res.redirect('/homepage');
  }
);
module.exports = router;
