//config/viewEngine.js

const path = require("path");
const express = require("express");

const configViewEngine = (app) => {
    // view engine setup
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
    app.use(express.static(path.join(__dirname, "../public")));
};

module.exports = configViewEngine;
