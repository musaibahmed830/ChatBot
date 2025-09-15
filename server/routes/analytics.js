const express = require('express');
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const startDate = getStartDate(period);
    
    // Get conversations for the period
    const conversations = await Conversation.find({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    });
    
    // Calculate metrics
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const unreadConversations = conversations.filter(conv => conv.isUnread).length;
    
    // Platform breakdown
    const platformBreakdown = {
      whatsapp: conversations.filter(c => c.platform === 'whatsapp').length,
      instagram: conversations.filter(c => c.platform === 'instagram').length,
      snapchat: conversations.filter(c => c.platform === 'snapchat').length
    };
    
    // Status breakdown
    const statusBreakdown = {
      active: conversations.filter(c => c.status === 'active').length,
      paused: conversations.filter(c => c.status === 'paused').length,
      closed: conversations.filter(c => c.status === 'closed').length,
      archived: conversations.filter(c => c.status === 'archived').length
    };
    
    // Response time metrics
    const responseTimes = conversations
      .filter(c => c.metrics.responseTime > 0)
      .map(c => c.metrics.responseTime);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Daily activity for charts
    const dailyActivity = getDailyActivity(conversations, period);
    
    res.json({
      success: true,
      data: {
        period,
        overview: {
          totalConversations,
          totalMessages,
          unreadConversations,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10
        },
        platformBreakdown,
        statusBreakdown,
        dailyActivity
      }
    });
  } catch (error) {
    logger.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// @desc    Get conversation analytics
// @route   GET /api/analytics/conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { period = '7d', platform, status } = req.query;
    const startDate = getStartDate(period);
    
    const query = {
      userId: req.user._id,
      createdAt: { $gte: startDate }
    };
    
    if (platform) query.platform = platform;
    if (status) query.status = status;
    
    const conversations = await Conversation.find(query)
      .sort({ lastMessageTime: -1 });
    
    // Calculate conversation metrics
    const metrics = conversations.map(conv => ({
      id: conv._id,
      platform: conv.platform,
      customerName: conv.customerName,
      status: conv.status,
      messageCount: conv.messages.length,
      botMessages: conv.metrics.botMessages,
      customerMessages: conv.metrics.customerMessages,
      responseTime: conv.metrics.responseTime,
      lastMessageTime: conv.lastMessageTime,
      satisfaction: conv.metrics.satisfaction
    }));
    
    res.json({
      success: true,
      data: {
        conversations: metrics,
        total: conversations.length
      }
    });
  } catch (error) {
    logger.error('Conversation analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation analytics'
    });
  }
});

// @desc    Get performance metrics
// @route   GET /api/analytics/performance
// @access  Private
router.get('/performance', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const startDate = getStartDate(period);
    
    const conversations = await Conversation.find({
      userId: req.user._id,
      createdAt: { $gte: startDate }
    });
    
    // Calculate performance metrics
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const botMessages = conversations.reduce((sum, conv) => sum + conv.metrics.botMessages, 0);
    const customerMessages = conversations.reduce((sum, conv) => sum + conv.metrics.customerMessages, 0);
    
    const responseTimes = conversations
      .filter(c => c.metrics.responseTime > 0)
      .map(c => c.metrics.responseTime);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const satisfactionRatings = conversations
      .filter(c => c.metrics.satisfaction > 0)
      .map(c => c.metrics.satisfaction);
    
    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;
    
    // Resolution time (time from first message to last message)
    const resolutionTimes = conversations
      .filter(c => c.messages.length > 1)
      .map(c => {
        const firstMessage = c.messages[0];
        const lastMessage = c.messages[c.messages.length - 1];
        return (lastMessage.timestamp - firstMessage.timestamp) / 1000; // in seconds
      });
    
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;
    
    res.json({
      success: true,
      data: {
        period,
        metrics: {
          totalConversations: conversations.length,
          totalMessages,
          botMessages,
          customerMessages,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
          responseRate: totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 0
        }
      }
    });
  } catch (error) {
    logger.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics'
    });
  }
});

// Helper functions
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function getDailyActivity(conversations, period) {
  const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const activity = {};
  
  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    activity[dateStr] = {
      conversations: 0,
      messages: 0
    };
  }
  
  // Count activity per day
  conversations.forEach(conv => {
    const dateStr = conv.createdAt.toISOString().split('T')[0];
    if (activity[dateStr]) {
      activity[dateStr].conversations++;
      activity[dateStr].messages += conv.messages.length;
    }
  });
  
  return Object.entries(activity).map(([date, data]) => ({
    date,
    conversations: data.conversations,
    messages: data.messages
  }));
}

module.exports = router;
