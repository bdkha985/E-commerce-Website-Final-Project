const { get } = require("../routes");

const getHomePage = (req, res) => {
    res.render('index.ejs');
}

function render(res, viewPath, locals = {}) {
    res.render('layouts/main', { body: viewPath, ...locals });
}

module.exports = {
    getHomePage,
    render
}