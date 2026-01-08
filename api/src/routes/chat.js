import express from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/messages', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.delete('/messages/:id', protect, deleteMessage);
router.post('/messages/:id/read', protect, markAsRead);
router.post('/messages/:id/reactions', protect, addReaction);
router.delete('/messages/:id/reactions/:emoji', protect, removeReaction);

export default router;
