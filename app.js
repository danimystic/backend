const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const db = require('./config/db');
const cors = require('cors');
const cloudinary = require('./config/cloudinary');

const home = require('./routes/home');
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const logoutRouter = require('./routes/logout');
const listSessionRouter = require('./routes/listSession');
const addProductsRouter = require('./routes/addProducts');
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/carts');
const ordersRouter = require('./routes/orders');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: false,
  cookie: {
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));


app.use('/', home);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/logout', logoutRouter);
app.use('/session-info', listSessionRouter);
app.use('/add-products', addProductsRouter);
app.use('/products', productsRouter);
app.use('/carts', cartsRouter);
app.use('/orders', ordersRouter);

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
