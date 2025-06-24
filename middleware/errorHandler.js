const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Validation error
  if (err.isJoi) {
    error.message = err.details[0].message;
    error.status = 400;
  }

  // MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        error.message = 'Email already exists';
        error.status = 409;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        error.message = 'Referenced record not found';
        error.status = 400;
        break;
      default:
        error.message = 'Database error';
        error.status = 500;
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };