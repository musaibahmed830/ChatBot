const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // Social media connections
  socialAccounts: {
    whatsapp: {
      isConnected: { type: Boolean, default: false },
      phoneNumber: { type: String },
      businessAccountId: { type: String },
      accessToken: { type: String },
      lastSync: { type: Date }
    },
    instagram: {
      isConnected: { type: Boolean, default: false },
      instagramUserId: { type: String },
      username: { type: String },
      accessToken: { type: String },
      lastSync: { type: Date }
    },
    snapchat: {
      isConnected: { type: Boolean, default: false },
      snapchatUserId: { type: String },
      username: { type: String },
      accessToken: { type: String },
      lastSync: { type: Date }
    }
  },
  // Chatbot preferences
  chatbotSettings: {
    personality: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'formal'],
      default: 'friendly'
    },
    language: {
      type: String,
      default: 'en'
    },
    autoRespond: {
      type: Boolean,
      default: true
    },
    responseDelay: {
      type: Number,
      default: 2000 // milliseconds
    },
    workingHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      timezone: { type: String, default: 'UTC' }
    }
  },
  // Analytics and usage
  analytics: {
    totalMessages: { type: Number, default: 0 },
    totalConversations: { type: Number, default: 0 },
    lastActivity: { type: Date },
    subscription: {
      type: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
      startDate: { type: Date },
      endDate: { type: Date }
    }
  }
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'socialAccounts.whatsapp.phoneNumber': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Transform JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
