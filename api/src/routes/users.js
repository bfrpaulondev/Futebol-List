import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getLeaderboard
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload, { handleMulterError } from '../middleware/upload.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), handleMulterError, uploadAvatar);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
