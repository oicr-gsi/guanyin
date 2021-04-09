'use strict';

require('dotenv').config();
var express = require('express');
var path = require('path');
var morgan = require('morgan');
var favicon = require('serve-favicon');
const logger = require('./utils/logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const uid = require('uid'); // generates a unique ID for each request
const ignoreFrom = process.env.IGNORE_ADDRESS || ''; // to skip logging of requests from IT's security tests
const prometheus = require('prom-client');
prometheus.collectDefaultMetrics({ timeout: 5000 });
const httpRequestDurationMilliseconds = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['route'],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500]
});

const httpRequestCounter = new prometheus.Counter({
  name: 'http_request_counter',
  help: 'Number of requests for this endpoint',
  labelNames: ['route', 'method', 'status']
});

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

app.use(morgan('common'));

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use((req, res, next) => {
  // have to manually set this because there's no guarantee it'll be called this in future versions of Express
  req._startTime = new Date();
  // generate a unique identifier for each request, if one hasn't already been set
  if (!req.uid) req.uid = uid();
  res.uid = req.uid;
  if (
    req.connection.remoteAddress != ignoreFrom &&
    req.originalUrl != '/metrics'
  ) {
    logger.info({
      uid: req.uid,
      method: req.method,
      url: req.originalUrl,
      origin: req.connection.remoteAddress
    });
  }
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
app.use((req, res, next) => {
  // log metrics after every request
  if (req.connection.remoteAddress != ignoreFrom) {
    const responseTimeInMs = Date.now() - Date.parse(req._startTime);
    const path = req.route ? req.route.path : req.originalUrl;
    httpRequestDurationMilliseconds.labels(path).observe(responseTimeInMs);
    httpRequestCounter.labels(path, req.method, res.statusCode).inc();
  }
  next();
});

app.use(function(err, req, res, next) {
  if (res._headerSent) {
    // we've already sent a 404 or other error code, which will already be logged
    next();
    return;
  }
  if (!err.status) {
    if (err.isBoom) {
      res
        .status(err.output.statusCode)
        .json({ message: err.data[0].message, path: err.data[0].path });
    } else if (err.name == 'ValidationError') {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    } else {
      // unexpected error, so log it
      logger.debug(err);
      logger.error({ url: req.originalUrl, message: err.message });
      res.status(500).json({
        status: 'error',
        message: app.get('env') === 'production' ? 'system error' : err //return err only in development env.
      });
    }
  } else {
    logger.debug(err);
    logger.error({ url: req.originalUrl, message: err.message });
    res.status(err.status).json({
      status: 'error',
      message: err.message
    });
  }
  res.end();
  next();
});

module.exports = app;
