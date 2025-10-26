import express from 'express';
import { getAllUsers, getUserProfile, updateProfile, blockUser, unblockUser, setNickname } from '../controllers/users.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
router.get('/:id', getUserProfile);

// PUT /api/users/profile
router.put('/profile', updateProfile);

// POST /api/users/block
router.post('/block', blockUser);

// POST /api/users/unblock
router.post('/unblock', unblockUser);

// POST /api/users/nickname
router.post('/nickname', setNickname);

export default router;