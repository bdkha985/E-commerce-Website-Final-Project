require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const flash = require("connect-flash");
const createError = require("http-errors");
const passport = require("passport");

const configViewEngine = require("./config/viewEngine");
const { connectDB } = require("./config/database");

//Routes
const webRoutes = require("./routes/web");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const socialAuthRoutes = require("./routes/auth.social");
const authApiRoutes = require("./routes/auth.api");
const accountApiRoutes = require("./routes/account.api.js");

//Passport cấu hình
require("./config/passport");

const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || "localhost";

// ======== MIDDLEWARES =======
// Logger
app.use(logger("dev"));

//Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// FAKE DATA
app.use((req, res, next) => {
    // TODO: thay bằng session/DB sau
    if (!res.locals.cartItems) {
        res.locals.cartItems = [
            {
                slug: "mid-century-modern-tshirt",
                name: "Mid Century Modern T-Shirt",
                qty: 1,
                price: 110000,
                image: "https://picsum.photos/seed/p1a/80/80",
            },
            {
                slug: "corporate-office-shoes",
                name: "Corporate Office Shoes",
                qty: 1,
                price: 399000,
                image: "https://picsum.photos/seed/p2a/80/80",
            },
        ];
    }
    res.locals.cartCount = res.locals.cartItems.length;
    next();
});

// Session
app.use(
    session({
        secret: "kshop-secret",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 }, // 1h
    })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    // Ưu tiên passport (req.user), fallback session (local signin)
    const u =
        req.user ||
        (req.session?.fullName
            ? {
                  id: req.session.userId,
                  fullName: req.session.fullName,
                  role: req.session.role,
              }
            : null);

    res.locals.currentUser = u;
    res.locals.isAuthenticated = !!u;

    // flash cho toast
    res.locals.flashSuccess = req.flash("success");
    res.locals.flashError = req.flash("error");

    next();
});

// config view engine
configViewEngine(app);

// ============ ROUTES ===========
app.use("/api/auth", authApiRoutes);
app.use("/api/account", accountApiRoutes);
app.use("/", socialAuthRoutes);
app.use("/", webRoutes);
app.use("/", indexRouter);
app.use("/users", usersRouter);

// ================ DATABASE + SERVER ==================
connectDB(process.env.MONGODB_URI)
    .then(() => {
        app.listen(port, hostname, () => {
            console.log(`✅ Server running at http://${hostname}:${port}`);
        });
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
