import express from 'express';
import { register, login, logout, googleAuth } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator, validate } from '../utils/validators.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerValidator), register);

// POST /api/auth/login
router.post('/login', validate(loginValidator), login);

// POST /api/auth/google
router.post('/google', googleAuth);

// POST /api/auth/logout (protected)
router.post('/logout', protect, logout);

export default router;