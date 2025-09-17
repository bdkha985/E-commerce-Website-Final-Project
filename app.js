require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const configViewEngine = require('./config/viewEngine');
const webRoutes = require('./routes/web');
const connection = require('./config/database')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || 'localhost';

// config view engine
configViewEngine(app);

//khai bao routes
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
app.use('/', webRoutes);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/users', usersRouter);
// app.use('/', require('./routes/web'));

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`)
})

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