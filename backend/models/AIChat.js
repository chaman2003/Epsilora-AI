import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['general', 'quiz_review'],
    default: 'general'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    courseName: String,
    quizScore: Number,
    totalQuestions: Number
  }
}, {
  timestamps: true
});

// Update lastUpdated whenever messages are modified
aiChatSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to get chat preview
aiChatSchema.methods.getPreview = function() {
  if (!this.messages.length) return 'New Chat';
  const firstMessage = this.messages[0].content;
  if (this.type === 'quiz_review') {
    return `Quiz Review: ${this.metadata.courseName || 'Unknown Course'}`;
  }
  return firstMessage.split('\n')[0].slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
};

const AIChat = mongoose.model('AIChat', aiChatSchema);

export default AIChat;
