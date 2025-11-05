//middlewares/requireLogin.api.js

const requireLoginApi = (req, res, next) => {
    const isLogged = !!(req.user || req.session?.userId);
    if (!isLogged)
        return res.status(401).json({
            ok: false,
            message: "Bạn cần đăng nhập",
        });
    next();
};

module.exports = requireLoginApi;
