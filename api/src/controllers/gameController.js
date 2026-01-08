import Game from '../models/Game.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/error.js';
import { drawTeamsAI } from '../services/aiService.js';

// @desc    Get next game
// @route   GET /api/games/next
// @access  Private
export const getNextGame = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const game = await Game.findOne({
    date: { $gte: now },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('attendees.user', 'name avatar skills stats')
    .populate('teams.teamA', 'name avatar skills')
    .populate('teams.teamB', 'name avatar skills')
    .populate('createdBy', 'name')
    .sort({ date: 1 });
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Nenhum jogo encontrado'
    });
  }
  
  res.json({
    success: true,
    game
  });
});

// @desc    Get game by ID
// @route   GET /api/games/:id
// @access  Private
export const getGameById = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate('attendees.user', 'name avatar skills stats')
    .populate('teams.teamA', 'name avatar skills')
    .populate('teams.teamB', 'name avatar skills')
    .populate('result.mvp', 'name avatar')
    .populate('createdBy', 'name');
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Jogo não encontrado'
    });
  }
  
  res.json({
    success: true,
    game
  });
});

// @desc    Confirm presence
// @route   POST /api/games/:id/confirm
// @access  Private
export const confirmPresence = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Jogo não encontrado'
    });
  }
  
  // Check if game is in the past
  if (new Date(game.date) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Não é possível confirmar presença em jogo passado'
    });
  }
  
  // Check if already confirmed
  const alreadyConfirmed = game.attendees.find(
    a => a.user.toString() === req.user.id && a.status === 'confirmed'
  );
  
  if (alreadyConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Presença já confirmada'
    });
  }
  
  // Check if game is full
  if (game.isFull) {
    return res.status(400).json({
      success: false,
      message: 'Jogo lotado'
    });
  }
  
  // Remove previous entry if exists
  game.attendees = game.attendees.filter(
    a => a.user.toString() !== req.user.id
  );
  
  // Add new confirmation
  game.attendees.push({
    user: req.user.id,
    status: 'confirmed',
    confirmedAt: new Date()
  });
  
  await game.save();
  
  // Populate and return
  await game.populate('attendees.user', 'name avatar skills stats');
  
  res.json({
    success: true,
    message: 'Presença confirmada com sucesso',
    game
  });
});

// @desc    Cancel presence
// @route   POST /api/games/:id/cancel
// @access  Private
export const cancelPresence = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Jogo não encontrado'
    });
  }
  
  // Remove from attendees
  const initialLength = game.attendees.length;
  game.attendees = game.attendees.filter(
    a => a.user.toString() !== req.user.id
  );
  
  if (game.attendees.length === initialLength) {
    return res.status(400).json({
      success: false,
      message: 'Presença não estava confirmada'
    });
  }
  
  await game.save();
  await game.populate('attendees.user', 'name avatar skills stats');
  
  res.json({
    success: true,
    message: 'Presença cancelada com sucesso',
    game
  });
});

// @desc    Draw teams
// @route   POST /api/games/:id/draw
// @access  Private
export const drawTeams = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate('attendees.user', 'name avatar skills stats preferredPosition');
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Jogo não encontrado'
    });
  }
  
  // Get confirmed players
  const confirmedPlayers = game.attendees
    .filter(a => a.status === 'confirmed')
    .map(a => a.user);
  
  if (confirmedPlayers.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Mínimo de 4 jogadores necessário para sortear times'
    });
  }
  
  // Draw teams using AI service
  const { teamA, teamB } = await drawTeamsAI(confirmedPlayers);
  
  // Update game
  game.teams.teamA = teamA;
  game.teams.teamB = teamB;
  
  await game.save();
  await game.populate('teams.teamA', 'name avatar skills');
  await game.populate('teams.teamB', 'name avatar skills');
  
  res.json({
    success: true,
    message: 'Times sorteados com sucesso',
    teams: {
      teamA: game.teams.teamA,
      teamB: game.teams.teamB
    }
  });
});

// @desc    Update game result
// @route   PUT /api/games/:id/result
// @access  Private (Admin)
export const updateResult = asyncHandler(async (req, res) => {
  const { scoreA, scoreB, mvpId } = req.body;
  
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Jogo não encontrado'
    });
  }
  
  // Update result
  game.result.scoreA = scoreA;
  game.result.scoreB = scoreB;
  game.result.mvp = mvpId || null;
  game.result.finishedAt = new Date();
  game.status = 'finished';
  
  await game.save();
  
  // Update player stats
  await updatePlayerStats(game);
  
  await game.populate('result.mvp', 'name avatar');
  
  res.json({
    success: true,
    message: 'Resultado atualizado com sucesso',
    game
  });
});

// @desc    Create new game
// @route   POST /api/games
// @access  Private (Admin)
export const createGame = asyncHandler(async (req, res) => {
  const { date, location, maxPlayers, cost } = req.body;
  
  const game = await Game.create({
    date,
    location: location || 'Pavilhão Municipal',
    maxPlayers: maxPlayers || 12,
    cost: cost || { total: 0, perPlayer: 0 },
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    game
  });
});

// Helper function to update player stats
async function updatePlayerStats(game) {
  const { teamA, teamB } = game.teams;
  const { scoreA, scoreB, mvp } = game.result;
  
  // Determine result
  let winnerTeam, loserTeam;
  if (scoreA > scoreB) {
    winnerTeam = teamA;
    loserTeam = teamB;
  } else if (scoreB > scoreA) {
    winnerTeam = teamB;
    loserTeam = teamA;
  }
  
  // Update stats for all players
  const allPlayers = [...teamA, ...teamB];
  
  for (const playerId of allPlayers) {
    const player = await User.findById(playerId);
    if (player) {
      player.stats.gamesPlayed += 1;
      
      if (scoreA === scoreB) {
        player.stats.draws += 1;
      } else if (winnerTeam.includes(playerId.toString())) {
        player.stats.wins += 1;
      } else {
        player.stats.losses += 1;
      }
      
      if (mvp && mvp.toString() === playerId.toString()) {
        player.stats.mvpCount += 1;
      }
      
      await player.save();
    }
  }
}
