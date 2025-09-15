import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  Text,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { theme, spacing } from '../../theme/theme';
import { apiClient } from '../../services/api';

interface Conversation {
  _id: string;
  platform: 'whatsapp' | 'instagram' | 'snapchat';
  customerName: string;
  customerPhone?: string;
  status: 'active' | 'paused' | 'closed' | 'archived';
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  unreadCount: number;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'bot' | 'customer';
    timestamp: string;
  }>;
}

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: conversations, isLoading, refetch } = useQuery(
    ['conversations', selectedPlatform],
    async () => {
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }
      
      const response = await apiClient.get(`/conversations?${params}`);
      return response.data.data.conversations as Conversation[];
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  const filteredConversations = conversations?.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
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
    switch (platform) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'paused':
        return theme.colors.warning;
      case 'closed':
        return theme.colors.placeholder;
      case 'archived':
        return theme.colors.placeholder;
      default:
        return theme.colors.primary;
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', { conversationId: item._id })}
    >
      <Card style={[styles.conversationCard, item.isUnread && styles.unreadCard]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.customerInfo}>
              <Avatar.Text
                size={48}
                label={item.customerName.charAt(0).toUpperCase()}
                style={[
                  styles.avatar,
                  { backgroundColor: getPlatformColor(item.platform) }
                ]}
              />
              <View style={styles.customerDetails}>
                <Title style={[styles.customerName, item.isUnread && styles.unreadText]}>
                  {item.customerName}
                </Title>
                <View style={styles.platformRow}>
                  <Icon
                    name={getPlatformIcon(item.platform)}
                    size={16}
                    color={getPlatformColor(item.platform)}
                  />
                  <Text style={styles.platformText}>
                    {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                  </Text>
                  <Chip
                    mode="outlined"
                    compact
                    style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
                    textStyle={{ color: getStatusColor(item.status), fontSize: 10 }}
                  >
                    {item.status}
                  </Chip>
                </View>
              </View>
            </View>
            <View style={styles.messageInfo}>
              <Text style={styles.timeText}>
                {formatDistanceToNow(new Date(item.lastMessageTime), { addSuffix: true })}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
          <Paragraph
            style={[styles.lastMessage, item.isUnread && styles.unreadText]}
            numberOfLines={2}
          >
            {item.lastMessage || 'No messages yet'}
          </Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const platforms = [
    { key: 'all', label: 'All' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'snapchat', label: 'Snapchat' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search conversations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.platformFilter}>
          {platforms.map((platform) => (
            <Chip
              key={platform.key}
              selected={selectedPlatform === platform.key}
              onPress={() => setSelectedPlatform(platform.key)}
              style={[
                styles.platformChip,
                selectedPlatform === platform.key && styles.selectedChip
              ]}
              textStyle={{
                color: selectedPlatform === platform.key 
                  ? theme.colors.surface 
                  : theme.colors.primary
              }}
            >
              {platform.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat" size={64} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubtext}>
              Start connecting your social media accounts to see conversations
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setMenuVisible(true)}
      />

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<View />}
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            // Navigate to new conversation
          }}
          title="New Conversation"
          leadingIcon="chat-plus"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            // Navigate to broadcast
          }}
          title="Send Broadcast"
          leadingIcon="broadcast"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            // Navigate to settings
          }}
          title="Settings"
          leadingIcon="cog"
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  platformFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  platformChip: {
    marginRight: spacing.sm,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
  },
  conversationCard: {
    marginBottom: spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  unreadText: {
    fontWeight: '700',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  platformText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 20,
  },
  messageInfo: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default ConversationsScreen;
