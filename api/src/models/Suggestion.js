import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    minlength: [3, 'Título deve ter pelo menos 3 caracteres'],
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    minlength: [10, 'Descrição deve ter pelo menos 10 caracteres']
  },
  category: {
    type: String,
    enum: ['equipment', 'event', 'improvement', 'other'],
    required: [true, 'Categoria é obrigatória']
  },
  estimatedCost: {
    type: Number,
    default: 0,
    min: [0, 'Custo não pode ser negativo']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  implementedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for filtering
suggestionSchema.index({ status: 1, createdAt: -1 });
suggestionSchema.index({ createdBy: 1 });

// Virtual for vote count
suggestionSchema.virtual('voteCount').get(function() {
  return this.votes.length;
});

// Method to add vote
suggestionSchema.methods.addVote = function(userId) {
  const exists = this.votes.find(v => v.user.toString() === userId.toString());
  if (exists) {
    throw new Error('Usuário já votou nesta sugestão');
  }
  
  this.votes.push({ user: userId });
  return this.save();
};

// Method to remove vote
suggestionSchema.methods.removeVote = function(userId) {
  this.votes = this.votes.filter(v => v.user.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
suggestionSchema.methods.addComment = function(userId, text) {
  this.comments.push({ user: userId, text });
  return this.save();
};

suggestionSchema.set('toJSON', { virtuals: true });
suggestionSchema.set('toObject', { virtuals: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

export default Suggestion;
