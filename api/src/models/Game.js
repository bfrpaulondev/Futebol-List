import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Data do jogo é obrigatória']
  },
  location: {
    type: String,
    default: 'Pavilhão Municipal',
    trim: true
  },
  maxPlayers: {
    type: Number,
    default: 12,
    min: 4,
    max: 20
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'finished', 'cancelled'],
    default: 'scheduled'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    confirmedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'maybe', 'cancelled'],
      default: 'confirmed'
    }
  }],
  teams: {
    teamA: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    teamB: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  result: {
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    mvp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    finishedAt: {
      type: Date,
      default: null
    }
  },
  cost: {
    total: { type: Number, default: 0 },
    perPlayer: { type: Number, default: 0 }
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for querying upcoming games
gameSchema.index({ date: 1, status: 1 });

// Virtual for confirmed players count
gameSchema.virtual('confirmedCount').get(function() {
  return this.attendees.filter(a => a.status === 'confirmed').length;
});

// Virtual for available spots
gameSchema.virtual('availableSpots').get(function() {
  return this.maxPlayers - this.confirmedCount;
});

// Virtual to check if game is full
gameSchema.virtual('isFull').get(function() {
  return this.confirmedCount >= this.maxPlayers;
});

// Method to add attendee
gameSchema.methods.addAttendee = function(userId) {
  const exists = this.attendees.find(a => a.user.toString() === userId.toString());
  if (exists) {
    throw new Error('Usuário já confirmado');
  }
  
  if (this.isFull) {
    throw new Error('Jogo lotado');
  }
  
  this.attendees.push({ user: userId, status: 'confirmed' });
  return this.save();
};

// Method to remove attendee
gameSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};

// Method to update result
gameSchema.methods.updateResult = function(scoreA, scoreB, mvpId) {
  this.result.scoreA = scoreA;
  this.result.scoreB = scoreB;
  this.result.mvp = mvpId;
  this.result.finishedAt = new Date();
  this.status = 'finished';
  return this.save();
};

gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

const Game = mongoose.model('Game', gameSchema);

export default Game;
