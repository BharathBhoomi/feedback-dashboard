const express = require('express');

// Optimize JSON parsing
const jsonParser = express.json({
  limit: '10mb',
  strict: true,
  type: 'application/json'
});

// Optimize URL encoding
const urlencodedParser = express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000
});

// Request timeout middleware
const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        error: 'Request timeout'
      });
    });
    next();
  };
};

module.exports = {
  jsonParser,
  urlencodedParser,
  timeoutMiddleware
};