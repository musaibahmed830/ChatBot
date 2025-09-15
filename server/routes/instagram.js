const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Connect Instagram account
// @route   POST /api/instagram/connect
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { accessToken, instagramUserId, username } = req.body;
    
    const user = await User.findById(req.user._id);
    user.socialAccounts.instagram = {
      isConnected: true,
      instagramUserId,
      username,
      accessToken,
      lastSync: new Date()
    };
    
    await user.save();
    
    logger.info(`Instagram connected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Instagram account connected successfully',
      data: {
        username,
        isConnected: true
      }
    });
  } catch (error) {
    logger.error('Instagram connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account'
    });
  }
});

// @desc    Disconnect Instagram account
// @route   DELETE /api/instagram/disconnect
// @access  Private
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.socialAccounts.instagram = {
      isConnected: false,
      instagramUserId: null,
      username: null,
      accessToken: null,
      lastSync: null
    };
    
    await user.save();
    
    logger.info(`Instagram disconnected for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });
  } catch (error) {
    logger.error('Instagram disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Instagram account'
    });
  }
});

// @desc    Get Instagram conversations
// @route   GET /api/instagram/conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const conversations = await Conversation.find({
      userId: req.user._id,
      platform: 'instagram'
    })
      .sort({ lastMessageTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Conversation.countDocuments({
      userId: req.user._id,
      platform: 'instagram'
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
    logger.error('Get Instagram conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Instagram webhook endpoint
router.post('/webhooks/instagram', async (req, res) => {
  try {
    // Instagram webhook processing would go here
    logger.info('Instagram webhook received:', req.body);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Instagram webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
