const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get available categories
// @route   GET /api/categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = [
      {
        id: 'general',
        name: 'General Chat',
        description: 'General conversations and casual chat',
        icon: '💬',
        color: '#007AFF'
      },
      {
        id: 'ecommerce',
        name: 'E-commerce Store',
        description: 'Online store for selling products',
        icon: '🛒',
        color: '#34C759',
        requiresNiche: true
      },
      {
        id: 'friends',
        name: 'Friends & Social',
        description: 'Casual conversations with friends',
        icon: '👥',
        color: '#FF9500'
      },
      {
        id: 'business',
        name: 'Business Services',
        description: 'Professional business services',
        icon: '💼',
        color: '#5856D6',
        requiresNiche: true
      },
      {
        id: 'support',
        name: 'Customer Support',
        description: 'Technical support and troubleshooting',
        icon: '🔧',
        color: '#FF3B30'
      },
      {
        id: 'education',
        name: 'Education',
        description: 'Educational content and learning',
        icon: '📚',
        color: '#AF52DE'
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        description: 'Fun and entertainment content',
        icon: '🎭',
        color: '#FF2D92'
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Health and medical information',
        icon: '🏥',
        color: '#30D158'
      },
      {
        id: 'realestate',
        name: 'Real Estate',
        description: 'Property and real estate services',
        icon: '🏠',
        color: '#FF9500'
      },
      {
        id: 'finance',
        name: 'Finance',
        description: 'Financial services and advice',
        icon: '💰',
        color: '#FFCC00'
      }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @desc    Get niches for a category
// @route   GET /api/categories/:categoryId/niches
// @access  Private
router.get('/:categoryId/niches', auth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const niches = {
      ecommerce: [
        { id: 'fashion', name: 'Fashion & Clothing', icon: '👗' },
        { id: 'electronics', name: 'Electronics & Gadgets', icon: '📱' },
        { id: 'home_garden', name: 'Home & Garden', icon: '🏡' },
        { id: 'beauty_health', name: 'Beauty & Health', icon: '💄' },
        { id: 'sports_fitness', name: 'Sports & Fitness', icon: '⚽' },
        { id: 'books_media', name: 'Books & Media', icon: '📖' },
        { id: 'toys_games', name: 'Toys & Games', icon: '🧸' },
        { id: 'automotive', name: 'Automotive', icon: '🚗' },
        { id: 'food_beverage', name: 'Food & Beverage', icon: '🍕' },
        { id: 'jewelry_watches', name: 'Jewelry & Watches', icon: '💍' }
      ],
      business: [
        { id: 'consulting', name: 'Consulting', icon: '🎯' },
        { id: 'marketing', name: 'Marketing & Advertising', icon: '📢' },
        { id: 'tech_services', name: 'Technology Services', icon: '💻' },
        { id: 'healthcare_services', name: 'Healthcare Services', icon: '🏥' },
        { id: 'education_services', name: 'Education Services', icon: '🎓' },
        { id: 'real_estate', name: 'Real Estate', icon: '🏘️' },
        { id: 'finance_insurance', name: 'Finance & Insurance', icon: '💼' },
        { id: 'legal_services', name: 'Legal Services', icon: '⚖️' },
        { id: 'travel_tourism', name: 'Travel & Tourism', icon: '✈️' },
        { id: 'food_restaurant', name: 'Food & Restaurant', icon: '🍽️' }
      ],
      general: [
        { id: 'general', name: 'General', icon: '💬' }
      ],
      friends: [
        { id: 'general', name: 'General', icon: '💬' }
      ],
      support: [
        { id: 'general', name: 'General', icon: '🔧' }
      ],
      education: [
        { id: 'general', name: 'General', icon: '📚' }
      ],
      entertainment: [
        { id: 'general', name: 'General', icon: '🎭' }
      ],
      healthcare: [
        { id: 'general', name: 'General', icon: '🏥' }
      ],
      realestate: [
        { id: 'general', name: 'General', icon: '🏠' }
      ],
      finance: [
        { id: 'general', name: 'General', icon: '💰' }
      ]
    };

    const categoryNiches = niches[categoryId] || [{ id: 'general', name: 'General', icon: '💬' }];

    res.json({
      success: true,
      data: categoryNiches
    });
  } catch (error) {
    logger.error('Get niches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch niches'
    });
  }
});

// @desc    Update user category and niche
// @route   PUT /api/categories/settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { purpose, niche, customNiche, businessInfo } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (purpose) user.chatbotSettings.purpose = purpose;
    if (niche) user.chatbotSettings.niche = niche;
    if (customNiche) user.chatbotSettings.customNiche = customNiche;
    if (businessInfo) user.chatbotSettings.businessInfo = businessInfo;
    
    await user.save();
    
    logger.info(`Category settings updated for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Category settings updated successfully',
      data: {
        purpose: user.chatbotSettings.purpose,
        niche: user.chatbotSettings.niche,
        customNiche: user.chatbotSettings.customNiche,
        businessInfo: user.chatbotSettings.businessInfo
      }
    });
  } catch (error) {
    logger.error('Update category settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category settings'
    });
  }
});

// @desc    Get user's current category settings
// @route   GET /api/categories/settings
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        purpose: user.chatbotSettings.purpose,
        niche: user.chatbotSettings.niche,
        customNiche: user.chatbotSettings.customNiche,
        businessInfo: user.chatbotSettings.businessInfo
      }
    });
  } catch (error) {
    logger.error('Get category settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category settings'
    });
  }
});

module.exports = router;
