const express = require("express");
const router = express.Router();

const { render, getHomePage } = require("../controllers/web/home.controller");
const products = require("../controllers/catalog/product.controller");
const requireLoginPage = require("../middlewares/requireLoginPage");
const catalog = require("../controllers/catalog/catalog.controller");
const cartController = require("../controllers/cart/cart.controller");
const checkoutController = require("../controllers/checkout/checkout.controller");
const searchController = require("../controllers/web/search.controller");
const homeController = require("../controllers/web/home.controller");

router.get("/", getHomePage);
router.get("/homepage", getHomePage);

router.get("/signin", (req, res) =>
    render(res, "pages/auth/signin", { title: "Đăng nhập" })
);

router.get("/signup", (req, res) =>
    render(res, "pages/auth/signup", { title: "Đăng kí" })
);

router.get("/force-change-password", (req, res) => {
    if (!req.session.tempUserId) {
        return res.redirect("/signin");
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

// POST: Xử lý gửi form liên hệ
router.post("/contact", homeController.postContact);

// POST: Xử lý đăng ký newsletter (Footer)
router.post("/newsletter", homeController.subscribeNewsletter);

// About us
router.get("/about", (req, res) =>
    render(res, "pages/about", { title: "About Us" })
);

// Cart
router.get("/cart", cartController.getCartPage);

// Checkout
router.get("/checkout", checkoutController.getCheckoutPage);

// Trang mà VNPAY sẽ trả về
router.get("/checkout/vnpay_return", checkoutController.handleVnpayReturn);

// Trang hiển thị kết quả (Thành công/Thất bại)
router.get("/order/result/:orderCode", checkoutController.getOrderResultPage);

// Search
router.get("/search", searchController.getResults);

// ========== CATALOG ==========
router.get("/categories", catalog.categoriesPage);
router.get("/c/:slug", catalog.categoryPage);
router.get("/products/all", catalog.allProductsPage);

// ========== PRODUCTS ==========
// router.get('/products',       products.list);
router.get("/products/:slug", products.detail); // Trang chi tiết sản phẩm

// === Logout ===
router.get("/logout", (req, res, next) => {
    // passport logout
    req.flash("success", "Bạn đã đăng xuất");

    req.logout((err) => {
        if (err) return next(err);

        // clear session local
        req.session.destroy(() => {
            res.clearCookie("connect.sid"); 
            res.redirect("/homepage");
        });
    });
});
module.exports = router;
