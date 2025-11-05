//middlewares/requireLoginPage.js

const requireLoginPage = (req, res, next) => {
    if (!req.user && !req.session?.userId) return res.redirect("/signin");
    next();
};

module.exports = requireLoginPage;
