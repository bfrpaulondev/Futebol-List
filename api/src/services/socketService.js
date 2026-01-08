import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

let io;

// Online users tracking
const onlineUsers = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);
    
    // Add to online users
    onlineUsers.set(socket.user.id.toString(), {
      socketId: socket.id,
      userId: socket.user.id,
      name: socket.user.name,
      avatar: socket.user.avatar
    });
    
    // Broadcast updated online users list
    io.emit('online_users', Array.from(onlineUsers.values()));
    
    // Join user's personal room
    socket.join(`user:${socket.user.id}`);
    
    // Chat events
    socket.on('chat:message', async (data) => {
      try {
        const { content, channel = 'general', replyTo } = data;
        
        const message = await Message.create({
          user: socket.user.id,
          content,
          channel,
          replyTo: replyTo || null
        });
        
        await message.populate('user', 'name avatar role');
        
        if (replyTo) {
          await message.populate('replyTo', 'content user');
        }
        
        // Broadcast to all users in channel
        io.emit(`chat:${channel}`, message);
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });
    
    socket.on('chat:typing', (data) => {
      const { channel = 'general', isTyping } = data;
      socket.broadcast.emit(`chat:typing:${channel}`, {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        isTyping
      });
    });
    
    // Game events
    socket.on('game:presence_updated', (data) => {
      io.emit('game:presence_changed', data);
    });
    
    socket.on('game:teams_drawn', (data) => {
      io.emit('game:teams_updated', data);
    });
    
    // Finance events
    socket.on('finance:suggestion_created', (data) => {
      io.emit('finance:new_suggestion', data);
    });
    
    socket.on('finance:vote_changed', (data) => {
      io.emit('finance:suggestion_updated', data);
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);
      
      // Remove from online users
      onlineUsers.delete(socket.user.id.toString());
      
      // Broadcast updated online users list
      io.emit('online_users', Array.from(onlineUsers.values()));
    });
  });
  
  console.log('✅ Socket.io initialized');
  
  return io;
};

// Emit event to specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit event to all users
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Get online users count
export const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

// Get online users list
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.values());
};

export { io };
