import { body, validationResult } from 'express-validator';

export const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

export const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .not()
    .isEmpty()
    .withMessage('Password is required')
];

export const messageValidator = [
  body('text')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  
  body('to')
    .isMongoId()
    .withMessage('Invalid recipient ID')
];

// Helper function to validate results
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};