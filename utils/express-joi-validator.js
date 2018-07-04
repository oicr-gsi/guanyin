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
      if (schema[key]) {
        toValidate[key] = req[key];
      }
    });

    const onValidationComplete = (err, validated) => {
      if (err) return next(new ValidationError(err.message, err.details));
      // copy the validated data to the req object
      Object.assign(req, validated);

      return next();
    };

    return Joi.validate(toValidate, schema, options, onValidationComplete);
  };
};
