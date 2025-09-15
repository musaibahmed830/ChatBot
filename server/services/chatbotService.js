const axios = require('axios');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

class ChatbotService {
  
  // Response templates based on personality
  static personalityTemplates = {
    professional: {
      greeting: "Hello! How can I assist you today?",
      farewell: "Thank you for your time. Have a great day!",
      default: "I understand your concern. Let me help you with that.",
      unsure: "I'm not sure I understand. Could you please provide more details?"
    },
    friendly: {
      greeting: "Hi there! 😊 How can I help you today?",
      farewell: "Thanks for chatting! Take care! 👋",
      default: "That's interesting! Let me see how I can help you with that.",
      unsure: "Hmm, I'm not quite sure what you mean. Could you explain a bit more? 🤔"
    },
    casual: {
      greeting: "Hey! What's up? How can I help?",
      farewell: "Catch you later! ✌️",
      default: "Got it! Let me help you out with that.",
      unsure: "Not sure what you're looking for. Mind clarifying?"
    },
    formal: {
      greeting: "Good day. I am here to assist you. How may I help?",
      farewell: "Thank you for your inquiry. Goodbye.",
      default: "I acknowledge your request and will provide appropriate assistance.",
      unsure: "I require additional information to provide accurate assistance."
    }
  };

  // Intent recognition patterns
  static intentPatterns = {
    greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    farewell: ['bye', 'goodbye', 'see you', 'farewell', 'take care'],
    help: ['help', 'assist', 'support', 'question', 'problem'],
    complaint: ['complaint', 'issue', 'problem', 'wrong', 'error', 'bug'],
    compliment: ['thanks', 'thank you', 'great', 'awesome', 'good job'],
    pricing: ['price', 'cost', 'fee', 'charge', 'expensive', 'cheap'],
    feature: ['feature', 'function', 'capability', 'what can', 'how does'],
    contact: ['contact', 'call', 'email', 'phone', 'reach']
  };

  /**
   * Generate chatbot response based on message and context
   */
  static async generateResponse({ message, context, userSettings, conversationHistory }) {
    try {
      const lowerMessage = message.toLowerCase().trim();
      
      // Detect intent
      const intent = this.detectIntent(lowerMessage);
      
      // Get personality templates
      const templates = this.personalityTemplates[userSettings.personality] || this.personalityTemplates.friendly;
      
      // Generate response based on intent and context
      let response = await this.generateIntentResponse(intent, templates, context, conversationHistory);
      
      // If no specific response, use AI service (OpenAI or similar)
      if (!response) {
        response = await this.generateAIResponse(message, userSettings, conversationHistory);
      }
      
      // Update context
      const updatedContext = {
        ...context,
        lastIntent: intent,
        lastResponse: response,
        conversationCount: (context.conversationCount || 0) + 1
      };
      
      return {
        text: response,
        intent,
        context: updatedContext,
        confidence: this.calculateConfidence(intent, lowerMessage)
      };
      
    } catch (error) {
      logger.error('Error generating chatbot response:', error);
      return {
        text: "I apologize, but I'm experiencing some technical difficulties. Please try again later.",
        intent: 'error',
        context: context,
        confidence: 0
      };
    }
  }

  /**
   * Detect user intent from message
   */
  static detectIntent(message) {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        return intent;
      }
    }
    return 'unknown';
  }

  /**
   * Generate response based on detected intent
   */
  static async generateIntentResponse(intent, templates, context, conversationHistory) {
    switch (intent) {
      case 'greeting':
        if (context.conversationCount === 0) {
          return templates.greeting;
        }
        return "Hello again! How can I help you today?";
        
      case 'farewell':
        return templates.farewell;
        
      case 'help':
        return "I'm here to help! What specific assistance do you need?";
        
      case 'complaint':
        return "I'm sorry to hear about this issue. Let me help you resolve it. Can you provide more details?";
        
      case 'compliment':
        return "Thank you so much! I'm glad I could help. Is there anything else you need?";
        
      case 'pricing':
        return "I'd be happy to help with pricing information. What specific product or service are you interested in?";
        
      case 'feature':
        return "Great question! I can help explain our features. What would you like to know more about?";
        
      case 'contact':
        return "I can help you get in touch with our team. Would you like our contact information or would you prefer to schedule a call?";
        
      default:
        return null; // Will fall back to AI response
    }
  }

  /**
   * Generate AI-powered response using external service
   */
  static async generateAIResponse(message, userSettings, conversationHistory) {
    try {
      // If OpenAI API key is available, use it
      if (process.env.OPENAI_API_KEY) {
        return await this.generateOpenAIResponse(message, userSettings, conversationHistory);
      }
      
      // Fallback to rule-based response
      return this.generateFallbackResponse(message, userSettings);
      
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return this.generateFallbackResponse(message, userSettings);
    }
  }

  /**
   * Generate response using OpenAI API
   */
  static async generateOpenAIResponse(message, userSettings, conversationHistory) {
    try {
      const personality = userSettings.personality;
      const language = userSettings.language;
      
      // Build conversation context
      const contextMessages = conversationHistory
        .slice(-5) // Last 5 messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');
      
      const prompt = `You are a helpful chatbot assistant with a ${personality} personality. 
      Respond in ${language === 'en' ? 'English' : language}.
      
      Previous conversation context:
      ${contextMessages}
      
      Current message: ${message}
      
      Respond in a ${personality} manner, keeping responses concise and helpful.`;
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.choices[0].message.content.trim();
      
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate fallback response when AI service is unavailable
   */
  static generateFallbackResponse(message, userSettings) {
    const templates = this.personalityTemplates[userSettings.personality] || this.personalityTemplates.friendly;
    
    // Simple keyword-based responses
    if (message.includes('?')) {
      return "That's a great question! I'll do my best to help you with that.";
    }
    
    if (message.length < 10) {
      return "Could you please provide more details about what you need help with?";
    }
    
    return templates.default;
  }

  /**
   * Calculate confidence score for intent detection
   */
  static calculateConfidence(intent, message) {
    if (intent === 'unknown') return 0.3;
    
    const patterns = this.intentPatterns[intent];
    const matches = patterns.filter(pattern => message.includes(pattern)).length;
    
    return Math.min(0.9, 0.5 + (matches * 0.1));
  }

  /**
   * Send WhatsApp message
   */
  static async sendWhatsAppMessage(recipient, message) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send Instagram message
   */
  static async sendInstagramMessage(recipient, message) {
    try {
      // Instagram API implementation would go here
      // This is a placeholder
      logger.info(`Instagram message to ${recipient}: ${message}`);
      
      return {
        success: true,
        messageId: `ig_${Date.now()}`
      };
    } catch (error) {
      logger.error('Instagram send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Snapchat message
   */
  static async sendSnapchatMessage(recipient, message) {
    try {
      // Snapchat API implementation would go here
      // This is a placeholder
      logger.info(`Snapchat message to ${recipient}: ${message}`);
      
      return {
        success: true,
        messageId: `sc_${Date.now()}`
      };
    } catch (error) {
      logger.error('Snapchat send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get chatbot analytics
   */
  static async getAnalytics(userId, period) {
    try {
      const startDate = this.getStartDate(period);
      
      const conversations = await Conversation.find({
        userId,
        createdAt: { $gte: startDate }
      });
      
      const totalConversations = conversations.length;
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      const botMessages = conversations.reduce((sum, conv) => sum + conv.metrics.botMessages, 0);
      const customerMessages = conversations.reduce((sum, conv) => sum + conv.metrics.customerMessages, 0);
      
      const platformBreakdown = {
        whatsapp: conversations.filter(c => c.platform === 'whatsapp').length,
        instagram: conversations.filter(c => c.platform === 'instagram').length,
        snapchat: conversations.filter(c => c.platform === 'snapchat').length
      };
      
      const avgResponseTime = conversations
        .filter(c => c.metrics.responseTime > 0)
        .reduce((sum, c) => sum + c.metrics.responseTime, 0) / totalConversations || 0;
      
      return {
        period,
        totalConversations,
        totalMessages,
        botMessages,
        customerMessages,
        platformBreakdown,
        avgResponseTime,
        satisfaction: this.calculateAverageSatisfaction(conversations)
      };
      
    } catch (error) {
      logger.error('Analytics error:', error);
      throw error;
    }
  }

  /**
   * Get chatbot templates
   */
  static async getTemplates() {
    // This would typically come from a database
    return [
      {
        id: 'welcome',
        name: 'Welcome Message',
        category: 'greeting',
        content: 'Hello! Welcome to our service. How can I help you today?',
        variables: []
      },
      {
        id: 'help',
        name: 'Help Response',
        category: 'support',
        content: 'I\'m here to help! What specific assistance do you need?',
        variables: []
      },
      {
        id: 'pricing',
        name: 'Pricing Information',
        category: 'sales',
        content: 'Our pricing starts at ${{price}} for {{plan}}. Would you like more details?',
        variables: ['price', 'plan']
      }
    ];
  }

  /**
   * Create chatbot template
   */
  static async createTemplate({ name, category, content, variables, userId }) {
    // This would typically save to a database
    return {
      id: `template_${Date.now()}`,
      name,
      category,
      content,
      variables,
      userId,
      createdAt: new Date()
    };
  }

  /**
   * Helper methods
   */
  static getStartDate(period) {
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

  static calculateAverageSatisfaction(conversations) {
    const ratedConversations = conversations.filter(c => c.metrics.satisfaction > 0);
    if (ratedConversations.length === 0) return 0;
    
    const totalSatisfaction = ratedConversations.reduce((sum, c) => sum + c.metrics.satisfaction, 0);
    return Math.round((totalSatisfaction / ratedConversations.length) * 10) / 10;
  }
}

module.exports = ChatbotService;
