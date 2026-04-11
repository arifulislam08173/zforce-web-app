/**
 * Global Error Handling Middleware
 * 
 * This middleware catches errors thrown from services/controllers
 * and sends a structured JSON response.
 * 
 * Usage:
 * app.use(errorHandler);
 */

const { ValidationError } = require('sequelize');

const errorHandler = (err, req, res, next) => {
  console.error(err); // Log full error for debugging

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Handle custom errors with .status
  else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};


module.exports = (err, req, res, next) => {
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many photos uploaded" });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Photo size is too large" });
    }

    return res.status(400).json({ message: err.message || "Upload error" });
  }

  console.error(err);
  return res.status(500).json({ message: err.message || "Internal server error" });
};

module.exports = errorHandler;
