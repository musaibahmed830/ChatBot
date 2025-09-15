const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
    default: 'text'
  },
  sender: {
    type: String,
    enum: ['user', 'bot', 'customer'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['whatsapp', 'instagram', 'snapchat'],
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  customerEmail: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'archived'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String
  }],
  messages: [messageSchema],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isUnread: {
    type: Boolean,
    default: false
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  // Analytics
  metrics: {
    totalMessages: { type: Number, default: 0 },
    botMessages: { type: Number, default: 0 },
    customerMessages: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in seconds
    resolutionTime: { type: Number, default: 0 }, // in seconds
    satisfaction: { type: Number, min: 1, max: 5 }
  },
  // Context and state
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
conversationSchema.index({ userId: 1, platform: 1 });
conversationSchema.index({ customerId: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageTime: -1 });
conversationSchema.index({ isUnread: 1 });

// Virtual for message count
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message
conversationSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.lastMessage = messageData.content;
  this.lastMessageTime = new Date();
  this.metrics.totalMessages += 1;
  
  if (messageData.sender === 'bot') {
    this.metrics.botMessages += 1;
  } else if (messageData.sender === 'customer') {
    this.metrics.customerMessages += 1;
    this.isUnread = true;
    this.unreadCount += 1;
  }
  
  return this.save();
};

// Method to mark as read
conversationSchema.methods.markAsRead = function() {
  this.isUnread = false;
  this.unreadCount = 0;
  this.messages.forEach(message => {
    message.isRead = true;
  });
  return this.save();
};

// Method to update context
conversationSchema.methods.updateContext = function(newContext) {
  this.context = { ...this.context, ...newContext };
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
