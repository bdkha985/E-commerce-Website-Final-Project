//app.js
// === TEST CI/CD PIPELINE ===3
require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const flash = require("connect-flash");
const createError = require("http-errors");
const passport = require("passport");
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const { createClient } = require("redis");
const CR = require("connect-redis");
const RedisStore =
  (CR && typeof CR === "function" && CR) ||  
  (CR && typeof CR.default === "function" && CR.default) ||
  (CR && typeof CR.RedisStore === "function" && CR.RedisStore);


const configViewEngine = require("./config/viewEngine");
const { connectDB } = require("./config/database");

//Routes
const cartService = require('./services/cart/cart.service.js');
const Category = require('./models/category.model');

const webRoutes = require("./routes/web.routes.js");
const socialAuthRoutes = require("./routes/auth.social.routes.js");
const apiRoutes = require("./routes/api");
const requireAdmin = require('./middlewares/requireAdmin');
const adminRoutes = require('./routes/admin/index');

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
const server = http.createServer(app);
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || "localhost";

// ======== MIDDLEWARES =======
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Logger
app.use(logger("dev"));

//Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session
const sessionMiddleware = session({
    store,
    secret: "kshop-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
});
app.use(sessionMiddleware);

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// --- Rate Limits ---
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/api/password-recovery', otpLimiter);

// === BỔ SUNG: Cấu hình Socket.io ===
const { Server } = require("socket.io");
const io = new Server(server); // 4. Khởi tạo Socket.io với http server

// Cho phép Socket.io truy cập session
io.engine.use(sessionMiddleware); 

io.on("connection", (socket) => {
  console.log("✅ Một người dùng đã kết nối Socket.io");

  // Lắng nghe sự kiện "join_room" từ client
  socket.on("join_room", (productId) => {
    socket.join(productId); // Cho socket này vào "phòng" của sản phẩm
    console.log(`Socket ${socket.id} đã tham gia phòng ${productId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Người dùng đã ngắt kết nối");
  });
});

// 5. Gắn 'io' vào app để controller có thể dùng
app.set('io', io);
// === KẾT THÚC BỔ SUNG ===

app.use(async (req, res, next) => {
    try {
        // Lấy thông tin User
        const u = req.user || (req.session?.fullName ? {
            id: req.session.userId,
            fullName: req.session.fullName,
            role: req.session.role,
        } : null);

        res.locals.currentUser = u;
        res.locals.isAuthenticated = !!u;

        // Lấy thông tin giỏ hàng
        const cartItems = await cartService.getCart(req);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.locals.cartItems = cartItems; // Cho mini-cart
        res.locals.cartCount = totalItems; // Cho badge

        // Flash cho toast
        res.locals.flashSuccess = req.flash("success");
        res.locals.flashError = req.flash("error");

        next();
    } catch (err) {
        next(err); // Chuyển lỗi nếu có
    }
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
app.use('/api', apiRoutes);
app.use('/admin', requireAdmin, adminRoutes);
app.use("/", socialAuthRoutes);
app.use("/", webRoutes);

// ================ DATABASE + SERVER ==================
connectDB(process.env.MONGODB_URI)
  .then(() => {
    // ĐÚNG: chạy server.listen để Socket.io hook vào đúng server
    server.listen(port, () => {
      console.log(`✅ Server running at http://0.0.0.0:${port}`);
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
