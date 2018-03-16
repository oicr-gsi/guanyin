'use strict';

require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
const logger = require('./utils/logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const expressJoi = require('express-joi-validator');
const Joi = require('joi');
const prometheus = require('prom-client');
prometheus.collectDefaultMetrics({ timeout: 5000 });

var index = require('./routes/index');

var swaggerJSDoc = require('swagger-jsdoc');

var app = express();

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'ReportDB API',
    version: '1.0.0',
    description: 'API for the ReportDB project'
  },
  basePath: '/'
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./routes/*.js']
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

// serve swagger
app.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use((req, res, next) => {
  // log the request method and URL
  logger.info({ method: req.method, url: req.originalUrl });
  next();
});

app.use('/', index);
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});

// catch 404 for all other endpoints and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
      status: 'error',
      message: err
    });
    next();
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  if (!err.status) {
    // unexpected error, so log it
    logger.error({ url: req.originalUrl, message: err.message });
  } else {
    res.status(err.status || 500).json({
      status: 'error',
      message: err.message
    });
  }
  res.end();
  next();
});

module.exports = app;
