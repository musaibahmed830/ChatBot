import axios from 'axios';

// Configure base URL based on environment
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Create a mock mode flag for development
const MOCK_API = true; // Set to false when you have a real backend

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock API responses for development
const mockResponses: Record<string, any> = {
  '/auth/register': (data: any) => ({
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        _id: 'mock_user_' + Date.now(),
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '',
        avatar: null,
        isActive: true,
        isVerified: false,
        socialAccounts: {
          whatsapp: { isConnected: false },
          instagram: { isConnected: false },
          snapchat: { isConnected: false }
        },
        chatbotSettings: {
          personality: 'friendly',
          language: 'en',
          autoRespond: true,
          responseDelay: 2,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '17:00',
            timezone: 'UTC'
          },
          purpose: 'general',
          niche: ''
        },
        analytics: {
          totalMessages: 0,
          totalConversations: 0,
          subscription: { type: 'free' }
        }
      }
    }
  }),
  '/auth/login': (data: any) => ({
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        _id: 'mock_user_123',
        username: 'mockuser',
        email: data.email,
        firstName: 'Mock',
        lastName: 'User',
        phone: '',
        avatar: null,
        isActive: true,
        isVerified: true,
        socialAccounts: {
          whatsapp: { isConnected: false },
          instagram: { isConnected: false },
          snapchat: { isConnected: false }
        },
        chatbotSettings: {
          personality: 'friendly',
          language: 'en',
          autoRespond: true,
          responseDelay: 2,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '17:00',
            timezone: 'UTC'
          },
          purpose: 'general',
          niche: ''
        },
        analytics: {
          totalMessages: 0,
          totalConversations: 0,
          subscription: { type: 'free' }
        }
      }
    }
  }),
  '/auth/me': () => ({
    data: {
      user: {
        _id: 'mock_user_123',
        username: 'mockuser',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User'
      }
    }
  })
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Mock API responses for development
    if (MOCK_API && config.url) {
      const mockResponse = mockResponses[config.url];
      if (mockResponse) {
        // Return a fake promise that resolves with mock data
        return Promise.reject({
          isMockResponse: true,
          mockData: typeof mockResponse === 'function' ? mockResponse(config.data) : mockResponse
        });
      }
    }

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle mock responses
    if (error.isMockResponse) {
      return Promise.resolve(error.mockData);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - redirecting to login');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
