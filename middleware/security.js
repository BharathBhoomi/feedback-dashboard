const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// Specific endpoint rate limiting for survey submissions
const surveyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 survey submissions per minute
  message: {
    success: false,
    error: 'Too many survey submissions, please wait'
  }
});

module.exports = { apiLimiter, surveyLimiter };