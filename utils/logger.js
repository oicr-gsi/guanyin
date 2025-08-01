'use strict';

const winston = require('winston');
const logLocation = process.env.LOG_LOCATION || 'logs';

const logger = winston.createLogger();
if (process.env.NODE_ENV !== 'test'){ 
  logger.add( new winston.transports.File({
        name: 'combined-log',
        filename: `${logLocation}/combined.log`,
        level: 'info',
        colorize: true,
        timestamp: 'tsFormat'
      })
  );
  logger.add( new winston.transports.File({
        name: 'error-log',
        filename: `${logLocation}/error.log`,
        level: 'error',
        handleException: true,
        humanReadableUnhandledException: true,
        colorize: true,
        timestamp: 'tsFormat'
      })
  );
}

if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL != 'prod') {
  logger.add(new winston.transports.Console({
    level: 'debug',
    colorize: true,
    timestamp: 'tsFormat'
  }));
}

module.exports = logger;
