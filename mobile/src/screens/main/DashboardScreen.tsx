import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Text,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { theme, spacing } from '../../theme/theme';
import { apiClient } from '../../services/api';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  unreadConversations: number;
  avgResponseTime: number;
  platformBreakdown: {
    whatsapp: number;
    instagram: number;
    snapchat: number;
  };
  dailyActivity: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery(
    'dashboard-stats',
    async () => {
      const response = await apiClient.get('/analytics/dashboard?period=7d');
      return response.data.data as DashboardStats;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getConnectedPlatforms = () => {
    const platforms = [];
    if (user?.socialAccounts.whatsapp.isConnected) platforms.push('WhatsApp');
    if (user?.socialAccounts.instagram.isConnected) platforms.push('Instagram');
    if (user?.socialAccounts.snapchat.isConnected) platforms.push('Snapchat');
    return platforms;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return 'chat';
      case 'instagram':
        return 'photo-camera';
      case 'snapchat':
        return 'camera-alt';
      default:
        return 'chat';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return theme.colors.whatsapp;
      case 'instagram':
        return theme.colors.instagram;
      case 'snapchat':
        return theme.colors.snapchat;
      default:
        return theme.colors.primary;
    }
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.welcomeText}>
          Welcome back, {user?.firstName}!
        </Title>
        <Paragraph style={styles.subtitle}>
          Here's what's happening with your chatbot
        </Paragraph>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { width: width / 2 - spacing.md }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="chat" size={24} color={theme.colors.primary} />
            <Title style={styles.statNumber}>
              {stats?.totalConversations || 0}
            </Title>
            <Text style={styles.statLabel}>Conversations</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { width: width / 2 - spacing.md }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="message" size={24} color={theme.colors.secondary} />
            <Title style={styles.statNumber}>
              {stats?.totalMessages || 0}
            </Title>
            <Text style={styles.statLabel}>Messages</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { width: width / 2 - spacing.md }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="notifications" size={24} color={theme.colors.warning} />
            <Title style={styles.statNumber}>
              {stats?.unreadConversations || 0}
            </Title>
            <Text style={styles.statLabel}>Unread</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { width: width / 2 - spacing.md }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="timer" size={24} color={theme.colors.success} />
            <Title style={styles.statNumber}>
              {stats?.avgResponseTime ? `${stats.avgResponseTime}s` : '0s'}
            </Title>
            <Text style={styles.statLabel}>Avg Response</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Purpose & Niche */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Your Chatbot Purpose</Title>
          <View style={styles.purposeContainer}>
            <View style={styles.purposeInfo}>
              <Text style={styles.purposeLabel}>Category:</Text>
              <Chip
                mode="outlined"
                style={styles.purposeChip}
                textStyle={styles.purposeChipText}
              >
                {user?.chatbotSettings.purpose?.charAt(0).toUpperCase() + user?.chatbotSettings.purpose?.slice(1) || 'General'}
              </Chip>
            </View>
            {user?.chatbotSettings.niche && user.chatbotSettings.niche !== 'general' && (
              <View style={styles.purposeInfo}>
                <Text style={styles.purposeLabel}>Niche:</Text>
                <Chip
                  mode="outlined"
                  style={styles.purposeChip}
                  textStyle={styles.purposeChipText}
                >
                  {user.chatbotSettings.niche.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Chip>
              </View>
            )}
            {user?.chatbotSettings.businessInfo?.businessName && (
              <View style={styles.purposeInfo}>
                <Text style={styles.purposeLabel}>Business:</Text>
                <Text style={styles.businessName}>{user.chatbotSettings.businessInfo.businessName}</Text>
              </View>
            )}
          </View>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('CategorySelection')}
            style={styles.changePurposeButton}
          >
            Change Purpose
          </Button>
        </Card.Content>
      </Card>

      {/* Connected Platforms */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Connected Platforms</Title>
          <View style={styles.platformsContainer}>
            {getConnectedPlatforms().length > 0 ? (
              getConnectedPlatforms().map((platform) => (
                <Chip
                  key={platform}
                  icon={() => (
                    <Icon
                      name={getPlatformIcon(platform)}
                      size={16}
                      color={getPlatformColor(platform)}
                    />
                  )}
                  style={[
                    styles.platformChip,
                    { backgroundColor: getPlatformColor(platform) + '20' },
                  ]}
                  textStyle={{ color: getPlatformColor(platform) }}
                >
                  {platform}
                </Chip>
              ))
            ) : (
              <View style={styles.noPlatformsContainer}>
                <Text style={styles.noPlatformsText}>
                  No platforms connected yet
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('SocialAccounts')}
                  style={styles.connectButton}
                >
                  Connect Platforms
                </Button>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Platform Breakdown */}
      {stats?.platformBreakdown && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Platform Activity</Title>
            <View style={styles.platformBreakdown}>
              {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
                <Surface key={platform} style={styles.platformItem}>
                  <View style={styles.platformInfo}>
                    <Icon
                      name={getPlatformIcon(platform)}
                      size={20}
                      color={getPlatformColor(platform)}
                    />
                    <Text style={styles.platformName}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.platformCount}>{count}</Text>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Quick Actions</Title>
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.actionButton}
              icon="chat-plus"
            >
              New Chat
            </Button>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.actionButton}
              icon="cog"
            >
              Settings
            </Button>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.actionButton}
              icon="chart-line"
            >
              Analytics
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.placeholder,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    marginBottom: spacing.md,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  platformChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  noPlatformsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noPlatformsText: {
    color: theme.colors.placeholder,
    marginBottom: spacing.md,
  },
  connectButton: {
    marginTop: spacing.sm,
  },
  platformBreakdown: {
    gap: spacing.sm,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    marginLeft: spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  platformCount: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  purposeContainer: {
    marginBottom: spacing.md,
  },
  purposeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  purposeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  purposeChip: {
    height: 28,
  },
  purposeChipText: {
    fontSize: 12,
  },
  businessName: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  changePurposeButton: {
    alignSelf: 'flex-start',
  },
});

export default DashboardScreen;
