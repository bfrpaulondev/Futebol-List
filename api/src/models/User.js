import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['player', 'admin'],
    default: 'player'
  },
  skills: {
    shooting: { type: Number, default: 5, min: 1, max: 10 },
    passing: { type: Number, default: 5, min: 1, max: 10 },
    dribbling: { type: Number, default: 5, min: 1, max: 10 },
    defense: { type: Number, default: 5, min: 1, max: 10 },
    physical: { type: Number, default: 5, min: 1, max: 10 },
    goalkeeping: { type: Number, default: 5, min: 1, max: 10 }
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    mvpCount: { type: Number, default: 0 }
  },
  preferredPosition: {
    type: String,
    enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
    default: 'any'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate overall rating
userSchema.virtual('overallRating').get(function() {
  const { shooting, passing, dribbling, defense, physical, goalkeeping } = this.skills;
  return Math.round((shooting + passing + dribbling + defense + physical + goalkeeping) / 6);
});

// Calculate win rate
userSchema.virtual('winRate').get(function() {
  if (this.stats.gamesPlayed === 0) return 0;
  return Math.round((this.stats.wins / this.stats.gamesPlayed) * 100);
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
