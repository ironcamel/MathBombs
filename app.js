var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const debug = require('debug')('mathbombs:app');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'react-ui', 'build')));

//app.use('/', indexRouter);
app.use('/api/v1', apiRouter);
app.get('/*', function (req, res) {
 //res.sendFile(path.join(__dirname, 'public', 'index.html'));
 res.sendFile(path.join(__dirname, 'react-ui', 'build', 'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if (err.status != 404) debug(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  //res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.error = err;

  res.status(err.status || 500);
  //res.render('error');
  const error = err.message || err;
  res.send({
    error,
    errors: [ error ],
  });
});

module.exports = app;
