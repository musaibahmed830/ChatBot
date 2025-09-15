const express = require('express');
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ChatbotService = require('../services/chatbotService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get chatbot settings
// @route   GET /api/chatbot/settings
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        settings: user.chatbotSettings
      }
    });
  } catch (error) {
    logger.error('Get chatbot settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chatbot settings'
    });
  }
});

// @desc    Update chatbot settings
// @route   PUT /api/chatbot/settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const {
      personality,
      language,
      autoRespond,
      responseDelay,
      workingHours
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (personality) user.chatbotSettings.personality = personality;
    if (language) user.chatbotSettings.language = language;
    if (autoRespond !== undefined) user.chatbotSettings.autoRespond = autoRespond;
    if (responseDelay) user.chatbotSettings.responseDelay = responseDelay;
    if (workingHours) user.chatbotSettings.workingHours = workingHours;
    
    await user.save();
    
    logger.info(`Chatbot settings updated for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Chatbot settings updated successfully',
      data: {
        settings: user.chatbotSettings
      }
    });
  } catch (error) {
    logger.error('Update chatbot settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chatbot settings'
    });
  }
});

// @desc    Generate chatbot response
// @route   POST /api/chatbot/generate-response
// @access  Private
router.post('/generate-response', auth, async (req, res) => {
  try {
    const { conversationId, message, context } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    const user = await User.findById(req.user._id);
    const response = await ChatbotService.generateResponse({
      message,
      context: context || conversation.context,
      userSettings: user.chatbotSettings,
      conversationHistory: conversation.messages.slice(-10) // Last 10 messages
    });
    
    res.json({
      success: true,
      data: {
        response,
        context: response.context
      }
    });
  } catch (error) {
    logger.error('Generate chatbot response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chatbot response'
    });
  }
});

// @desc    Send chatbot response
// @route   POST /api/chatbot/send-response
// @access  Private
router.post('/send-response', auth, async (req, res) => {
  try {
    const { conversationId, response, platform } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Send response via appropriate platform
    let sendResult;
    switch (platform) {
      case 'whatsapp':
        sendResult = await ChatbotService.sendWhatsAppMessage(
          conversation.customerId,
          response
        );
        break;
      case 'instagram':
        sendResult = await ChatbotService.sendInstagramMessage(
          conversation.customerId,
          response
        );
        break;
      case 'snapchat':
        sendResult = await ChatbotService.sendSnapchatMessage(
          conversation.customerId,
          response
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported platform'
        });
    }
    
    if (sendResult.success) {
      // Add message to conversation
      await conversation.addMessage({
        id: sendResult.messageId,
        content: response,
        type: 'text',
        sender: 'bot',
        timestamp: new Date(),
        metadata: {
          platform,
          messageId: sendResult.messageId
        }
      });
      
      res.json({
        success: true,
        message: 'Response sent successfully',
        data: {
          messageId: sendResult.messageId,
          platform
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send response',
        error: sendResult.error
      });
    }
  } catch (error) {
    logger.error('Send chatbot response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send chatbot response'
    });
  }
});

// @desc    Get chatbot analytics
// @route   GET /api/chatbot/analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const analytics = await ChatbotService.getAnalytics(req.user._id, period);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get chatbot analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// @desc    Test chatbot response
// @route   POST /api/chatbot/test
// @access  Private
router.post('/test', auth, async (req, res) => {
  try {
    const { message, personality, language } = req.body;
    
    const user = await User.findById(req.user._id);
    const testSettings = {
      ...user.chatbotSettings,
      ...(personality && { personality }),
      ...(language && { language })
    };
    
    const response = await ChatbotService.generateResponse({
      message,
      context: {},
      userSettings: testSettings,
      conversationHistory: []
    });
    
    res.json({
      success: true,
      data: {
        input: message,
        output: response.text,
        personality: testSettings.personality,
        language: testSettings.language
      }
    });
  } catch (error) {
    logger.error('Test chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test chatbot'
    });
  }
});

// @desc    Get chatbot templates
// @route   GET /api/chatbot/templates
// @access  Private
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await ChatbotService.getTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Get chatbot templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// @desc    Create chatbot template
// @route   POST /api/chatbot/templates
// @access  Private
router.post('/templates', auth, async (req, res) => {
  try {
    const { name, category, content, variables } = req.body;
    
    const template = await ChatbotService.createTemplate({
      name,
      category,
      content,
      variables,
      userId: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    logger.error('Create chatbot template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
});

module.exports = router;
