import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  socialAccounts: {
    whatsapp: {
      isConnected: boolean;
      phoneNumber?: string;
      businessAccountId?: string;
      lastSync?: Date;
    };
    instagram: {
      isConnected: boolean;
      instagramUserId?: string;
      username?: string;
      lastSync?: Date;
    };
    snapchat: {
      isConnected: boolean;
      snapchatUserId?: string;
      username?: string;
      lastSync?: Date;
    };
  };
  chatbotSettings: {
    personality: 'professional' | 'friendly' | 'casual' | 'formal';
    language: string;
    autoRespond: boolean;
    responseDelay: number;
    workingHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
    purpose: 'general' | 'ecommerce' | 'friends' | 'business' | 'support' | 'education' | 'entertainment' | 'healthcare' | 'realestate' | 'finance' | 'custom';
    niche: string;
    customNiche?: string;
    businessInfo?: {
      businessName?: string;
      businessType?: string;
      targetAudience?: string;
      keyProducts?: string[];
      businessGoals?: string[];
    };
  };
  analytics: {
    totalMessages: number;
    totalConversations: number;
    lastActivity?: Date;
    subscription: {
      type: 'free' | 'basic' | 'premium';
      startDate?: Date;
      endDate?: Date;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@auth_user',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store token and user data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      // Set authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData: RegisterData) => {
    try {
      set({ isLoading: true });
      
      const response = await apiClient.post('/auth/register', userData);
      
      const { token, user } = response.data;
      
      // Store token and user data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      // Set authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      // Clear stored data
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      
      // Clear authorization header
      delete apiClient.defaults.headers.common['Authorization'];
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      const updatedUser = response.data.user;
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      set({ user: updatedUser });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      
      const [token, userString] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
      ]);

      if (token[1] && userString[1]) {
        const user = JSON.parse(userString[1]);
        
        // Set authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token[1]}`;
        
        // Verify token is still valid
        try {
          await apiClient.get('/auth/me');
          
          set({
            user,
            token: token[1],
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear stored data
          await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
          delete apiClient.defaults.headers.common['Authorization'];
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },
}));
