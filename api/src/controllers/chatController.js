import Message from '../models/Message.js';
import { asyncHandler } from '../middleware/error.js';

// @desc    Get messages
// @route   GET /api/chat/messages
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const { channel = 'general', limit = 50 } = req.query;
  
  const messages = await Message.find({
    channel,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'name avatar role')
    .populate('replyTo', 'content user')
    .populate('reactions.users', 'name avatar');
  
  // Reverse to get chronological order
  messages.reverse();
  
  res.json({
    success: true,
    count: messages.length,
    messages
  });
});

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, type = 'text', channel = 'general', replyTo, imageUrl } = req.body;
  
  if (!content && !imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Conteúdo ou imagem é obrigatório'
    });
  }
  
  const message = await Message.create({
    user: req.user.id,
    content: content || '',
    type,
    channel,
    replyTo: replyTo || null,
    imageUrl: imageUrl || null
  });
  
  await message.populate('user', 'name avatar role');
  
  if (replyTo) {
    await message.populate('replyTo', 'content user');
  }
  
  res.status(201).json({
    success: true,
    message
  });
});

// @desc    Delete message
// @route   DELETE /api/chat/messages/:id
// @access  Private
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Mensagem não encontrada'
    });
  }
  
  // Check if user owns the message or is admin
  if (message.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Não autorizado a deletar esta mensagem'
    });
  }
  
  // Soft delete
  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();
  
  res.json({
    success: true,
    message: 'Mensagem deletada com sucesso'
  });
});

// @desc    Mark message as read
// @route   POST /api/chat/messages/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Mensagem não encontrada'
    });
  }
  
  const alreadyRead = message.readBy.find(
    r => r.user.toString() === req.user.id
  );
  
  if (!alreadyRead) {
    message.readBy.push({ user: req.user.id });
    await message.save();
  }
  
  res.json({
    success: true,
    message: 'Mensagem marcada como lida'
  });
});

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:id/reactions
// @access  Private
export const addReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  
  if (!emoji) {
    return res.status(400).json({
      success: false,
      message: 'Emoji é obrigatório'
    });
  }
  
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Mensagem não encontrada'
    });
  }
  
  await message.addReaction(emoji, req.user.id);
  await message.populate('reactions.users', 'name avatar');
  
  res.json({
    success: true,
    message: 'Reação adicionada',
    reactions: message.reactions
  });
});

// @desc    Remove reaction from message
// @route   DELETE /api/chat/messages/:id/reactions/:emoji
// @access  Private
export const removeReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.params;
  
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Mensagem não encontrada'
    });
  }
  
  await message.removeReaction(emoji, req.user.id);
  
  res.json({
    success: true,
    message: 'Reação removida',
    reactions: message.reactions
  });
});
