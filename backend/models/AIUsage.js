import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  conversationCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('AIUsage', aiUsageSchema);
