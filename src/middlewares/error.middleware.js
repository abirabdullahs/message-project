export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// Handle 404 errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Validation error handler
export const handleValidationError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  next(err);
};

// Handle duplicate key errors
export const handleDuplicateKeyError = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: 'Duplicate Key Error',
      details: `${field} already exists`
    });
  }
  next(err);
};