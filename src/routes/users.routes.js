import express from 'express';
import { 
  getAllUsers, 
  getUserProfile, 
  updateProfile, 
  blockUser, 
  unblockUser, 
  setNickname,
  followUser,
  unfollowUser,
  getChatList
} from '../controllers/users.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/chat-list
router.get('/chat-list', getChatList);

// GET /api/users/:id
router.get('/:id', getUserProfile);

// PUT /api/users/profile
router.put('/profile', updateProfile);

// POST /api/users/follow
router.post('/follow', followUser);

// POST /api/users/unfollow
router.post('/unfollow', unfollowUser);

// POST /api/users/block
router.post('/block', blockUser);

// POST /api/users/unblock
router.post('/unblock', unblockUser);

// POST /api/users/nickname
router.post('/nickname', setNickname);

export default router;