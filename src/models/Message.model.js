import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
});

// Create TTL index on expiresAt
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create compound index for efficient chat queries
MessageSchema.index({ chatId: 1, createdAt: -1 });

// Pre-save hook to set expiresAt if not set
MessageSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration to 1 hour from creation
    this.expiresAt = new Date(this.createdAt.getTime() + 60 * 60 * 1000);
  }
  next();
});

// Helper method to generate chatId
MessageSchema.statics.generateChatId = function(userId1, userId2) {
  // Sort IDs to ensure consistent chatId regardless of sender/receiver order
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
};

const Message = mongoose.model('Message', MessageSchema);

export default Message;