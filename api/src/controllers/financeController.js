import Transaction from '../models/Transaction.js';
import Suggestion from '../models/Suggestion.js';
import { asyncHandler } from '../middleware/error.js';

// @desc    Get balance
// @route   GET /api/finance/balance
// @access  Private
export const getBalance = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({});
  
  let income = 0;
  let expense = 0;
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });
  
  const balance = income - expense;
  
  // Get recent transactions
  const recentTransactions = await Transaction.find({})
    .sort({ date: -1 })
    .limit(5)
    .populate('user', 'name avatar')
    .populate('createdBy', 'name');
  
  // Calculate monthly stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const monthlyTransactions = await Transaction.find({
    date: { $gte: thisMonth }
  });
  
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  
  monthlyTransactions.forEach(t => {
    if (t.type === 'income') {
      monthlyIncome += t.amount;
    } else {
      monthlyExpense += t.amount;
    }
  });
  
  res.json({
    success: true,
    balance: {
      total: balance,
      income,
      expense,
      monthly: {
        income: monthlyIncome,
        expense: monthlyExpense,
        balance: monthlyIncome - monthlyExpense
      }
    },
    recentTransactions
  });
});

// @desc    Get transactions
// @route   GET /api/finance/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate, limit = 50 } = req.query;
  
  const filter = {};
  
  if (type) filter.type = type;
  if (category) filter.category = category;
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  const transactions = await Transaction.find(filter)
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .populate('user', 'name avatar')
    .populate('game', 'date')
    .populate('createdBy', 'name');
  
  res.json({
    success: true,
    count: transactions.length,
    transactions
  });
});

// @desc    Create transaction
// @route   POST /api/finance/transactions
// @access  Private (Admin)
export const createTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, description, date, userId, gameId } = req.body;
  
  const transaction = await Transaction.create({
    type,
    category,
    amount,
    description,
    date: date || Date.now(),
    user: userId || null,
    game: gameId || null,
    createdBy: req.user.id
  });
  
  await transaction.populate('user', 'name avatar');
  
  res.status(201).json({
    success: true,
    message: 'Transação criada com sucesso',
    transaction
  });
});

// @desc    Get suggestions
// @route   GET /api/finance/suggestions
// @access  Private
export const getSuggestions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const filter = status ? { status } : {};
  
  const suggestions = await Suggestion.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name avatar')
    .populate('votes.user', 'name avatar')
    .populate('comments.user', 'name avatar');
  
  res.json({
    success: true,
    count: suggestions.length,
    suggestions
  });
});

// @desc    Create suggestion
// @route   POST /api/finance/suggestions
// @access  Private
export const createSuggestion = asyncHandler(async (req, res) => {
  const { title, description, category, estimatedCost } = req.body;
  
  const suggestion = await Suggestion.create({
    title,
    description,
    category,
    estimatedCost: estimatedCost || 0,
    createdBy: req.user.id
  });
  
  await suggestion.populate('createdBy', 'name avatar');
  
  res.status(201).json({
    success: true,
    message: 'Sugestão criada com sucesso',
    suggestion
  });
});

// @desc    Vote on suggestion
// @route   POST /api/finance/suggestions/:id/vote
// @access  Private
export const voteSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Sugestão não encontrada'
    });
  }
  
  // Check if already voted
  const alreadyVoted = suggestion.votes.find(
    v => v.user.toString() === req.user.id
  );
  
  if (alreadyVoted) {
    return res.status(400).json({
      success: false,
      message: 'Você já votou nesta sugestão'
    });
  }
  
  suggestion.votes.push({ user: req.user.id });
  await suggestion.save();
  
  await suggestion.populate('votes.user', 'name avatar');
  
  res.json({
    success: true,
    message: 'Voto registrado com sucesso',
    suggestion
  });
});

// @desc    Remove vote from suggestion
// @route   DELETE /api/finance/suggestions/:id/vote
// @access  Private
export const unvoteSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Sugestão não encontrada'
    });
  }
  
  const initialLength = suggestion.votes.length;
  suggestion.votes = suggestion.votes.filter(
    v => v.user.toString() !== req.user.id
  );
  
  if (suggestion.votes.length === initialLength) {
    return res.status(400).json({
      success: false,
      message: 'Você não votou nesta sugestão'
    });
  }
  
  await suggestion.save();
  
  res.json({
    success: true,
    message: 'Voto removido com sucesso',
    suggestion
  });
});

// @desc    Update suggestion status (Admin)
// @route   PUT /api/finance/suggestions/:id/status
// @access  Private (Admin)
export const updateSuggestionStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  const suggestion = await Suggestion.findById(req.params.id);
  
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Sugestão não encontrada'
    });
  }
  
  suggestion.status = status;
  
  if (status === 'implemented') {
    suggestion.implementedAt = new Date();
  }
  
  if (status === 'rejected' && rejectionReason) {
    suggestion.rejectionReason = rejectionReason;
  }
  
  await suggestion.save();
  
  res.json({
    success: true,
    message: 'Status atualizado com sucesso',
    suggestion
  });
});

// @desc    Add comment to suggestion
// @route   POST /api/finance/suggestions/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  const suggestion = await Suggestion.findById(req.params.id);
  
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Sugestão não encontrada'
    });
  }
  
  suggestion.comments.push({
    user: req.user.id,
    text
  });
  
  await suggestion.save();
  await suggestion.populate('comments.user', 'name avatar');
  
  res.json({
    success: true,
    message: 'Comentário adicionado com sucesso',
    suggestion
  });
});
