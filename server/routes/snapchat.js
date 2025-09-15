const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Connect Snapchat account
// @route   POST /api/snapchat/connect
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { accessToken, snapchatUserId, username } = req.body;
    
    const user = await User.findById(req.user._id);
    user.socialAccounts.snapchat = {
      isConnected: true,
      snapchatUserId,
      username,
      accessToken,
      lastSync: new Date()
    };
    
    await user.save();
    
    logger.info(`Snapchat connected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Snapchat account connected successfully',
      data: {
        username,
        isConnected: true
      }
    });
  } catch (error) {
    logger.error('Snapchat connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Snapchat account'
    });
  }
});

// @desc    Disconnect Snapchat account
// @route   DELETE /api/snapchat/disconnect
// @access  Private
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.socialAccounts.snapchat = {
      isConnected: false,
      snapchatUserId: null,
      username: null,
      accessToken: null,
      lastSync: null
    };
    
    await user.save();
    
    logger.info(`Snapchat disconnected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Snapchat account disconnected successfully'
    });
  } catch (error) {
    logger.error('Snapchat disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Snapchat account'
    });
  }
});

// @desc    Get Snapchat conversations
// @route   GET /api/snapchat/conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const conversations = await Conversation.find({
      userId: req.user._id,
      platform: 'snapchat'
    })
      .sort({ lastMessageTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Conversation.countDocuments({
      userId: req.user._id,
      platform: 'snapchat'
    });
    
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
    logger.error('Get Snapchat conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Snapchat webhook endpoint
router.post('/webhooks/snapchat', async (req, res) => {
  try {
    // Snapchat webhook processing would go here
    logger.info('Snapchat webhook received:', req.body);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Snapchat webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
