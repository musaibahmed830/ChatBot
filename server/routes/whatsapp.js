const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

const router = express.Router();

// WhatsApp API configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// @desc    Connect WhatsApp account
// @route   POST /api/whatsapp/connect
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { phoneNumber, businessAccountId } = req.body;
    
    // TODO: Implement WhatsApp Business API OAuth flow
    // For now, we'll simulate the connection
    
    const user = await User.findById(req.user._id);
    user.socialAccounts.whatsapp = {
      isConnected: true,
      phoneNumber,
      businessAccountId,
      accessToken: ACCESS_TOKEN, // In real implementation, this would come from OAuth
      lastSync: new Date()
    };
    
    await user.save();
    
    logger.info(`WhatsApp connected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'WhatsApp account connected successfully',
      data: {
        phoneNumber,
        isConnected: true
      }
    });
  } catch (error) {
    logger.error('WhatsApp connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect WhatsApp account'
    });
  }
});

// @desc    Disconnect WhatsApp account
// @route   DELETE /api/whatsapp/disconnect
// @access  Private
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.socialAccounts.whatsapp = {
      isConnected: false,
      phoneNumber: null,
      businessAccountId: null,
      accessToken: null,
      lastSync: null
    };
    
    await user.save();
    
    logger.info(`WhatsApp disconnected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'WhatsApp account disconnected successfully'
    });
  } catch (error) {
    logger.error('WhatsApp disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect WhatsApp account'
    });
  }
});

// @desc    Send WhatsApp message
// @route   POST /api/whatsapp/send-message
// @access  Private
router.post('/send-message', auth, async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user.socialAccounts.whatsapp.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp account not connected'
      });
    }
    
    // Prepare message payload based on type
    let messagePayload;
    
    switch (type) {
      case 'text':
        messagePayload = {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        };
        break;
      case 'template':
        messagePayload = {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: message
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported message type'
        });
    }
    
    // Send message via WhatsApp API
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save message to conversation
    const conversation = await Conversation.findOne({
      userId: req.user._id,
      platform: 'whatsapp',
      customerId: to
    });
    
    if (conversation) {
      await conversation.addMessage({
        id: response.data.messages[0].id,
        content: message,
        type: type,
        sender: 'bot',
        timestamp: new Date(),
        metadata: {
          whatsappMessageId: response.data.messages[0].id
        }
      });
    }
    
    logger.info(`WhatsApp message sent to ${to} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: response.data.messages[0].id,
        recipient: to
      }
    });
  } catch (error) {
    logger.error('WhatsApp send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.response?.data || error.message
    });
  }
});

// @desc    Get WhatsApp conversations
// @route   GET /api/whatsapp/conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {
      userId: req.user._id,
      platform: 'whatsapp'
    };
    
    if (status) {
      query.status = status;
    }
    
    const conversations = await Conversation.find(query)
      .sort({ lastMessageTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'firstName lastName email')
      .lean();
    
    const total = await Conversation.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get WhatsApp conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// @desc    Get WhatsApp conversation messages
// @route   GET /api/whatsapp/conversations/:conversationId/messages
// @access  Private
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      platform: 'whatsapp'
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const messages = conversation.messages
      .slice(startIndex, endIndex)
      .reverse(); // Show newest first
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversation.messages.length,
          pages: Math.ceil(conversation.messages.length / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// @desc    WhatsApp webhook verification
// @route   GET /webhooks/whatsapp
// @access  Public
router.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// @desc    WhatsApp webhook for receiving messages
// @route   POST /webhooks/whatsapp
// @access  Public
router.post('/webhooks/whatsapp', async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes;
        changes.forEach(async (change) => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages) {
              messages.forEach(async (message) => {
                await processIncomingMessage(message, change.value);
              });
            }
          }
        });
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    res.status(500).send('Error');
  }
});

// Helper function to process incoming WhatsApp messages
async function processIncomingMessage(message, value) {
  try {
    const from = message.from;
    const messageType = message.type;
    let content = '';
    
    // Extract content based on message type
    switch (messageType) {
      case 'text':
        content = message.text.body;
        break;
      case 'image':
        content = '[Image]';
        break;
      case 'video':
        content = '[Video]';
        break;
      case 'audio':
        content = '[Audio]';
        break;
      case 'document':
        content = '[Document]';
        break;
      case 'location':
        content = '[Location]';
        break;
      default:
        content = '[Unsupported message type]';
    }
    
    // Find or create conversation
    // Note: In a real implementation, you'd need to determine which user
    // this message belongs to based on the phone number or business account
    const conversation = await Conversation.findOneAndUpdate(
      {
        platform: 'whatsapp',
        customerId: from
      },
      {
        $set: {
          customerId: from,
          customerName: from, // You might want to get this from WhatsApp contacts
          customerPhone: from,
          lastMessage: content,
          lastMessageTime: new Date(),
          isUnread: true,
          $inc: { 'unreadCount': 1 }
        }
      },
      {
        upsert: true,
        new: true
      }
    );
    
    // Add message to conversation
    await conversation.addMessage({
      id: message.id,
      content,
      type: messageType,
      sender: 'customer',
      timestamp: new Date(message.timestamp * 1000),
      metadata: {
        whatsappMessageId: message.id,
        originalMessage: message
      }
    });
    
    // TODO: Trigger chatbot response if auto-respond is enabled
    
    logger.info(`WhatsApp message received from ${from}: ${content}`);
  } catch (error) {
    logger.error('Error processing WhatsApp message:', error);
  }
}

module.exports = router;
