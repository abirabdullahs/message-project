import express from 'express';
import { getMessages, sendMessage, cleanupMessages } from '../controllers/messages.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { messageValidator } from '../utils/validators.js';

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// GET /api/messages/:chatId
router.get('/:chatId', getMessages);

// POST /api/messages/send
router.post('/send', messageValidator, sendMessage);

// DELETE /api/messages/cleanup (admin only - optional)
router.delete('/cleanup', cleanupMessages);

export default router;