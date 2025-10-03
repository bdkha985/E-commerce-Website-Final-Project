const { get } = require("../routes");

function render(res, viewPath, locals = {}) {
    res.render("layouts/main", { body: viewPath, ...locals });
}

module.exports = {
    render
};
