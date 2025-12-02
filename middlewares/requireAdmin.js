// middlewares/requireAdmin.js

const requireAdmin = (req, res, next) => {
    // Kiểm tra xem đã đăng nhập chưa VÀ có phải admin không
    if (req.isAuthenticated() && req.user.roles.includes("admin")) {
        return next();
    }

    // Không phải admin
    req.flash("error", "Bạn không có quyền truy cập trang này.");
    return res.redirect("/signin");
};

module.exports = requireAdmin;
