const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['greeting', 'support', 'sales', 'marketing', 'custom']
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    defaultValue: {
      type: String
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for better performance
templateSchema.index({ userId: 1, category: 1 });
templateSchema.index({ isPublic: 1, category: 1 });

module.exports = mongoose.model('Template', templateSchema);
