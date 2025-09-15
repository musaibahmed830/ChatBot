const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  metrics: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    botMessages: { type: Number, default: 0 },
    customerMessages: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    satisfaction: { type: Number, default: 0 },
    platformBreakdown: {
      whatsapp: { type: Number, default: 0 },
      instagram: { type: Number, default: 0 },
      snapchat: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ userId: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
