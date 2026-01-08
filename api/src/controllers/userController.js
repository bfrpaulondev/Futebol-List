import User from '../models/User.js';
import { asyncHandler } from '../middleware/error.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferredPosition, skills } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  // Update fields
  if (name) user.name = name;
  if (preferredPosition) user.preferredPosition = preferredPosition;
  
  // Update skills if provided
  if (skills) {
    if (skills.shooting !== undefined) user.skills.shooting = skills.shooting;
    if (skills.passing !== undefined) user.skills.passing = skills.passing;
    if (skills.dribbling !== undefined) user.skills.dribbling = skills.dribbling;
    if (skills.defense !== undefined) user.skills.defense = skills.defense;
    if (skills.physical !== undefined) user.skills.physical = skills.physical;
    if (skills.goalkeeping !== undefined) user.skills.goalkeeping = skills.goalkeeping;
  }
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Perfil atualizado com sucesso',
    user
  });
});

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo enviado'
    });
  }
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  // Save avatar path
  user.avatar = `/uploads/${req.file.filename}`;
  await user.save();
  
  res.json({
    success: true,
    message: 'Avatar atualizado com sucesso',
    avatar: user.avatar
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('-password')
    .sort({ name: 1 });
  
  res.json({
    success: true,
    count: users.length,
    users
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  res.json({
    success: true,
    user
  });
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  const { name, email, role, isActive, skills } = req.body;
  
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (skills) user.skills = { ...user.skills, ...skills };
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Usuário atualizado com sucesso',
    user
  });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  // Soft delete
  user.isActive = false;
  await user.save();
  
  res.json({
    success: true,
    message: 'Usuário desativado com sucesso'
  });
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { sort = 'winRate' } = req.query;
  
  const users = await User.find({ isActive: true, 'stats.gamesPlayed': { $gt: 0 } })
    .select('name avatar stats skills')
    .lean();
  
  // Calculate additional stats
  const usersWithStats = users.map(user => ({
    ...user,
    winRate: user.stats.gamesPlayed > 0 
      ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100) 
      : 0,
    overallRating: Math.round(
      (user.skills.shooting + user.skills.passing + user.skills.dribbling + 
       user.skills.defense + user.skills.physical + user.skills.goalkeeping) / 6
    )
  }));
  
  // Sort based on parameter
  let sortedUsers;
  switch (sort) {
    case 'goals':
      sortedUsers = usersWithStats.sort((a, b) => b.stats.goals - a.stats.goals);
      break;
    case 'assists':
      sortedUsers = usersWithStats.sort((a, b) => b.stats.assists - a.stats.assists);
      break;
    case 'mvp':
      sortedUsers = usersWithStats.sort((a, b) => b.stats.mvpCount - a.stats.mvpCount);
      break;
    case 'rating':
      sortedUsers = usersWithStats.sort((a, b) => b.overallRating - a.overallRating);
      break;
    default: // winRate
      sortedUsers = usersWithStats.sort((a, b) => b.winRate - a.winRate);
  }
  
  res.json({
    success: true,
    users: sortedUsers.slice(0, 20) // Top 20
  });
});
