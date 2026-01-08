import dotenv from 'dotenv';

dotenv.config();

export default {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/futebol-app',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Game Settings
  maxPlayersPerGame: parseInt(process.env.MAX_PLAYERS_PER_GAME || '12'),
  gameDay: parseInt(process.env.GAME_DAY || '6'), // Saturday
  gameTime: process.env.GAME_TIME || '20:00',
  
  // AI
  openaiApiKey: process.env.OPENAI_API_KEY || ''
};
