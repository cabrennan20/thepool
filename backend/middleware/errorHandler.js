const { z } = require('zod');

/**
 * Centralized error handling middleware
 * Sanitizes error responses and prevents information disclosure
 */
function errorHandler(err, req, res, next) {
  // Log full error details for debugging (server-side only)
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '[REDACTED]',
    path: req.path,
    method: req.method,
    user: req.user ? req.user.userId : 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }))
    });
  }

  // Handle specific known errors
  if (err.code === '23505') { // PostgreSQL unique constraint
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key constraint
    return res.status(400).json({
      error: 'Invalid reference to related resource'
    });
  }

  if (err.code === '42P01') { // PostgreSQL undefined table
    return res.status(500).json({
      error: 'Service temporarily unavailable'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication token expired'
    });
  }

  // Handle custom application errors
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Default error response (sanitized for production)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && {
      details: err.message,
      stack: err.stack
    })
  });
}

/**
 * Handle 404 errors for undefined routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
}

/**
 * Async error wrapper to catch promise rejections
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};