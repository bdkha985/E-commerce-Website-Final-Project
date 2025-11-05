//app.js
require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const flash = require("connect-flash");
const createError = require("http-errors");
const passport = require("passport");

const { createClient } = require("redis");
const CR = require("connect-redis");
const RedisStore =
  (CR && typeof CR === "function" && CR) ||  
  (CR && typeof CR.default === "function" && CR.default) ||
  (CR && typeof CR.RedisStore === "function" && CR.RedisStore);


const configViewEngine = require("./config/viewEngine");
const { connectDB } = require("./config/database");

//Routes
const Category = require('./models/category.model');
const webRoutes = require("./routes/web");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const socialAuthRoutes = require("./routes/auth.social");
const authApiRoutes = require("./routes/auth.api");
const accountApiRoutes = require("./routes/account.api.js");
const passwordRecovery = require('./routes/passwordRecovery.api.js')

//Passport cấu hình
require("./config/passport");

// Redis client (node-redis v4)
const redisClient = createClient({ url: "redis://redis:6379" });
redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

// Tạo store
const store = new RedisStore({
  client: redisClient,
  prefix: "kshop:sess:",
});

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

// Session
app.use(
  session({
    store,
    secret: "kshop-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
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

// Test
app.use(async (req, res, next) => {
  try {
    const cats = await Category.find({ parentId: null })
      .select('name slug')
      .sort({ name: 1 })
      .lean();
    res.locals.navCategories = cats;  // mảng [{name, slug}, ...]
  } catch (e) {
    res.locals.navCategories = [];
  }
  next();
});

// config view engine
configViewEngine(app);

// ============ ROUTES ===========
app.use("/api/auth", authApiRoutes);
app.use("/api/account", accountApiRoutes);
app.use('/api/auth', passwordRecovery)
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
      console.error('ERROR HANDLER:', err); // test
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
