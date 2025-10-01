const express = require("express");

const { test, render } = require("../controllers/homeController");
const products = require("../controllers/productsController");
const {
    signupRules,
    signinRules,
    handleValidation,
} = require("../middlewares/authValidator");
const requireLoginPage = require("../middlewares/requireLoginPage");

const router = express.Router();

router.get("/homepage", (req, res) =>
    render(res, "pages/index.ejs", { title: "Trang chủ" })
);
router.get("/", (req, res) =>
    render(res, "pages/index.ejs", { title: "Trang chủ" })
);

router.get("/", test);
// router.get('/products', (req,res) =>
//     render(res, 'pages/products', {title: 'Products'})
//     );

// Auth
router.get("/signin", (req, res) =>
    render(res, "pages/auth/signin", { title: "Sign In" })
);

router.get("/signup", (req, res) =>
    render(res, "pages/auth/signup", { title: "Sign Up" })
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

// Products list & detail
router.get("/products", products.list);
router.get("/products/:slug", products.detail);

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
