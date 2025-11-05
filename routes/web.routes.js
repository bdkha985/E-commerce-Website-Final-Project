const express = require("express");
const router = express.Router();

const { render, getHomePage } = require("../controllers/web/homeController");
const products = require("../controllers/catalog/productsController");
const {
    signupRules,
    signinRules,
    handleValidation,
} = require("../middlewares/authValidator");
const requireLoginPage = require("../middlewares/requireLoginPage");
const catalog  = require('../controllers/catalog/catalogController');
const cartController = require('../controllers/cart/cartController');

// ========== Trang tĩnh / auth ==========
// router.get("/homepage", (req, res) =>
//     render(res, "pages/index.ejs", { title: "Trang chủ" })
// );
// router.get("/", (req, res) =>
//     render(res, "pages/index.ejs", { title: "Trang chủ" })
// );

router.get('/', getHomePage);   
router.get('/homepage', getHomePage);  

router.get("/signin", (req, res) =>
    render(res, "pages/auth/signin", { title: "Đăng nhập" })
);

router.get("/signup", (req, res) =>
    render(res, "pages/auth/signup", { title: "Đăng kí" })
);

router.get("/force-change-password", (req, res) => {
    // Kiểm tra xem có tempUserId trong session không
    if (!req.session.tempUserId) {
        return res.redirect('/signin'); // Nếu không có, quay lại đăng nhập
    }
    render(res, "pages/auth/force-change-password", { title: "Đổi Mật Khẩu" });
});

// Reset password
router.get("/forgot", (req, res) =>
    render(res, "pages/auth/forgot", { title: "Quên mật khẩu" })
);
router.get("/verify-otp", (req, res) =>
    render(res, "pages/auth/verify-otp", {
        title: "Xác thực OTP",
        email: req.query.email || "",
    })
);
router.get("/reset-password", (req, res) =>
    render(res, "pages/auth/reset-password", {
        title: "Đặt mật khẩu mới",
        email: req.query.email || "",
        token: req.query.token || "",
    })
);

// Account profile
router.get("/account", requireLoginPage, (req, res) =>
    render(res, "pages/account/index", { title: "Tài khoản" })
);

// Blog
router.get("/blog", (req, res) => render(res, "pages/blog", { title: "Blog" }));

// Contact us
router.get("/contact", (req, res) =>
    render(res, "pages/contact", { title: "Contact Us" })
);

// About us
router.get("/about", (req, res) =>
    render(res, "pages/about", { title: "About Us" })
);

// Cart
router.get("/cart", cartController.getCartPage);

// ========== CATALOG ==========
router.get('/c/:slug', catalog.categoryPage);  
router.get('/products/all', catalog.allProductsPage);

// ========== PRODUCTS ==========
// router.get('/products',       products.list); 
router.get('/products/:slug', products.detail);  // Trang chi tiết sản phẩm

// === Logout ===
router.get("/logout", (req, res, next) => {
    // passport logout
    req.flash("success", "Bạn đã đăng xuất");

    req.logout((err) => {
        if (err) return next(err);

        // clear session local
        req.session.destroy(() => {
            res.clearCookie("connect.sid"); // xoá cookie session
            res.redirect("/homepage"); // quay về trang đăng nhập
        });
    });
});
module.exports = router;
