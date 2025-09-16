const { get } = require("../routes");

const getHomePage = (req, res) => {
    res.send('Hello World! controller');
}

const getABC = (req, res) => {
    res.render('index.ejs');
}

const duykh4 = (req, res) => {
    res.send('Duykh4 dep trai vcl');
}

module.exports = {
    getHomePage,
    getABC,
    duykh4
}