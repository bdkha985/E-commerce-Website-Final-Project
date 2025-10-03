const express = require("express");
const router = express.Router();

const { render } = require("../controllers/homeController");
const products = require("../controllers/productsController");
const {
    signupRules,
    signinRules,
    handleValidation,
} = require("../middlewares/authValidator");
const requireLoginPage = require("../middlewares/requireLoginPage");
const catalog  = require('../controllers/catalogController');

// ========== Trang tĩnh / auth ==========
router.get("/homepage", (req, res) =>
    render(res, "pages/index.ejs", { title: "Trang chủ" })
);
router.get("/", (req, res) =>
    render(res, "pages/index.ejs", { title: "Trang chủ" })
);

router.get("/signin", (req, res) =>
    render(res, "pages/auth/signin", { title: "Đăng nhập" })
);

router.get("/signup", (req, res) =>
    render(res, "pages/auth/signup", { title: "Đăng kí" })
);

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
router.get("/cart", (req, res) => render(res, "pages/cart", { title: "Cart" }));

// ========== CATALOG ==========
router.get('/c/:slug', catalog.categoryPage);      // Trang theo category (men, women, ...)
router.get('/products/all', catalog.allProductsPage); // Tất cả sản phẩm (catalog-style)

// ========== PRODUCTS ==========
router.get('/products',       products.list);    // Danh sách sản phẩm (search, filter, phân trang)
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
