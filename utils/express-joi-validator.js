'use strict';

const Joi = require('joi');

module.exports = function validate(schema, options) {
  options = options || {
    abortEarly: false
  };

  function ValidationError(message, details) {
    this.status = 400;
    this.message = message;
    if (details) this.details = details;
  }
  ValidationError.prototype = Error.prototype;

  return function validateRequest(req, res, next) {
    const toValidate = {};
    if (!schema) return next();

    ['params', 'body', 'query'].forEach(key => {
      if (schema.describe().keys[key] !== undefined) {
        toValidate[key] = req[key];
      }
    });

   const { value, error } = schema.validate(toValidate, options);
 
   if (error) return next(new ValidationError(error.message, error.details));
   // copy the validated data to the req object
   Object.assign(req, value);

   return next();
  };
};
