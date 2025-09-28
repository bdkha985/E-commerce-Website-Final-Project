require('dotenv').config();
require('express-async-errors');

const flash = require('connect-flash');
const session = require('express-session');
var createError = require('http-errors');
const express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const configViewEngine = require('./config/viewEngine');
const webRoutes = require('./routes/web');
const { connectDB } = require('./config/database');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || 'localhost';

// FAKE DATA
app.use((req, res, next) => {
  // Demo: thay bằng session/DB sau
  if (!res.locals.cartItems) {
    res.locals.cartItems = [
      { slug:'mid-century-modern-tshirt', name:'Mid Century Modern T-Shirt', qty:1, price:110000, image:'https://picsum.photos/seed/p1a/80/80' },
      { slug:'corporate-office-shoes',    name:'Corporate Office Shoes',    qty:1, price:399000, image:'https://picsum.photos/seed/p2a/80/80' },
    ];
  }
  res.locals.cartCount = res.locals.cartItems.length;
  next();
});

//web routes
app.use(logger('dev'));

// parse body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Check
app.use(session({
  secret: 'kshop-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60 } // 1h
}));

app.use(flash());
app.use((req, res, next) => {
  // đưa user đang đăng nhập ra view
  if (req.session && req.session.fullName) {
    res.locals.currentUser = {
      fullName: req.session.fullName,
      role: req.session.role
    };
  } else res.locals.currentUser = null;

  // đưa flash ra view (nếu dùng toast)
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError   = req.flash('error');
  next();
});

// config view engine
configViewEngine(app);

//routes
app.use('/', webRoutes);

app.use('/', indexRouter);
app.use('/users', usersRouter);

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, hostname, () => {
      console.log(`✅ Server running at http://${hostname}:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// app.use('/', require('./routes/auth.api'));
app.use('/', require('./routes/auth.api'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;