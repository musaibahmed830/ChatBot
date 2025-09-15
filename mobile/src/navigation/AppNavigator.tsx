import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ConversationsScreen from '../screens/main/ConversationsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

// Settings Screens
import ChatbotSettingsScreen from '../screens/settings/ChatbotSettingsScreen';
import SocialAccountsScreen from '../screens/settings/SocialAccountsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';

// Setup Screens
import CategorySelectionScreen from '../screens/setup/CategorySelectionScreen';
import NicheSelectionScreen from '../screens/setup/NicheSelectionScreen';
import BusinessInfoScreen from '../screens/setup/BusinessInfoScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Conversations':
            iconName = 'chat';
            break;
          case 'Analytics':
            iconName = 'analytics';
            break;
          case 'Settings':
            iconName = 'settings';
            break;
          default:
            iconName = 'help';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.placeholder,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.outline,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Conversations" 
      component={ConversationsScreen}
      options={{ title: 'Chats' }}
    />
    <Tab.Screen 
      name="Analytics" 
      component={AnalyticsScreen}
      options={{ title: 'Analytics' }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.surface,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Conversation' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen 
      name="ChatbotSettings" 
      component={ChatbotSettingsScreen}
      options={{ title: 'Chatbot Settings' }}
    />
    <Stack.Screen 
      name="SocialAccounts" 
      component={SocialAccountsScreen}
      options={{ title: 'Social Accounts' }}
    />
    <Stack.Screen 
      name="NotificationSettings" 
      component={NotificationSettingsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen 
      name="CategorySelection" 
      component={CategorySelectionScreen}
      options={{ title: 'Choose Purpose', headerShown: false }}
    />
    <Stack.Screen 
      name="NicheSelection" 
      component={NicheSelectionScreen}
      options={{ title: 'Choose Niche', headerShown: false }}
    />
    <Stack.Screen 
      name="BusinessInfo" 
      component={BusinessInfoScreen}
      options={{ title: 'Business Info', headerShown: false }}
    />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;
