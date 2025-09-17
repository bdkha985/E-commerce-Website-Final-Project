const { get } = require("../routes");

const test = (req, res) => {
    res.render('index.ejs');
}

function render(res, viewPath, locals = {}) {
    res.render('layouts/main', { body: viewPath, ...locals });
}

module.exports = {
    test,
    render
}