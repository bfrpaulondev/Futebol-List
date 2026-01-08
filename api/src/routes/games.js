import express from 'express';
import {
  getNextGame,
  getGameById,
  confirmPresence,
  cancelPresence,
  drawTeams,
  updateResult,
  createGame
} from '../controllers/gameController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/next', protect, getNextGame);
router.get('/:id', protect, getGameById);
router.post('/:id/confirm', protect, confirmPresence);
router.post('/:id/cancel', protect, cancelPresence);
router.post('/:id/draw', protect, drawTeams);
router.put('/:id/result', protect, authorize('admin'), updateResult);
router.post('/', protect, authorize('admin'), createGame);

export default router;
