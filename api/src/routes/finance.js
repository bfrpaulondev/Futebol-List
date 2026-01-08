import express from 'express';
import {
  getBalance,
  getTransactions,
  createTransaction,
  getSuggestions,
  createSuggestion,
  voteSuggestion,
  unvoteSuggestion,
  updateSuggestionStatus,
  addComment
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.post('/transactions', protect, authorize('admin'), createTransaction);
router.get('/suggestions', protect, getSuggestions);
router.post('/suggestions', protect, createSuggestion);
router.post('/suggestions/:id/vote', protect, voteSuggestion);
router.delete('/suggestions/:id/vote', protect, unvoteSuggestion);
router.put('/suggestions/:id/status', protect, authorize('admin'), updateSuggestionStatus);
router.post('/suggestions/:id/comments', protect, addComment);

export default router;
