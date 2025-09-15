import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { theme, spacing } from '../../theme/theme';
import { apiClient } from '../../services/api';

interface Niche {
  id: string;
  name: string;
  icon: string;
}

interface RouteParams {
  categoryId: string;
}

const NicheSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId } = route.params as RouteParams;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [customNiche, setCustomNiche] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const { data: niches, isLoading } = useQuery(
    ['niches', categoryId],
    async () => {
      const response = await apiClient.get(`/categories/${categoryId}/niches`);
      return response.data.data as Niche[];
    }
  );

  const updateNicheMutation = useMutation(
    async (nicheData: any) => {
      const response = await apiClient.put('/categories/settings', nicheData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile');
        navigation.navigate('BusinessInfo', { 
          categoryId, 
          nicheId: selectedNiche,
          customNiche: showCustomInput ? customNiche : undefined
        });
      },
    }
  );

  const handleNicheSelect = (nicheId: string) => {
    setSelectedNiche(nicheId);
    setShowCustomInput(nicheId === 'custom');
  };

  const handleContinue = () => {
    const nicheData: any = { niche: selectedNiche };
    if (showCustomInput && customNiche.trim()) {
      nicheData.customNiche = customNiche.trim();
    }
    updateNicheMutation.mutate(nicheData);
  };

  const getNicheIcon = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      '👗': 'checkroom',
      '📱': 'phone-android',
      '🏡': 'home',
      '💄': 'face',
      '⚽': 'sports-soccer',
      '📖': 'menu-book',
      '🧸': 'toys',
      '🚗': 'directions-car',
      '🍕': 'restaurant',
      '💍': 'diamond',
      '🎯': 'gps-fixed',
      '📢': 'campaign',
      '💻': 'computer',
      '🏥': 'local-hospital',
      '🎓': 'school',
      '🏘️': 'location-city',
      '💼': 'work',
      '⚖️': 'gavel',
      '✈️': 'flight',
      '🍽️': 'restaurant-menu',
      '💬': 'chat',
      '🔧': 'build',
      '📚': 'book',
      '🎭': 'theater-comedy',
      '💰': 'attach-money'
    };
    return iconMap[icon] || 'help';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading niches...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Choose Your Niche</Title>
        <Paragraph style={styles.subtitle}>
          Select your specific area of focus to get more targeted responses
        </Paragraph>
      </View>

      <View style={styles.nichesContainer}>
        {niches?.map((niche) => (
          <TouchableOpacity
            key={niche.id}
            onPress={() => handleNicheSelect(niche.id)}
            disabled={updateNicheMutation.isLoading}
          >
            <Card
              style={[
                styles.nicheCard,
                selectedNiche === niche.id && styles.selectedCard
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.nicheHeader}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={getNicheIcon(niche.icon)}
                      size={24}
                      color={selectedNiche === niche.id ? theme.colors.primary : theme.colors.placeholder}
                    />
                  </View>
                  <Text style={[
                    styles.nicheName,
                    selectedNiche === niche.id && styles.selectedText
                  ]}>
                    {niche.name}
                  </Text>
                  {selectedNiche === niche.id && (
                    <Icon
                      name="check-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {showCustomInput && (
        <View style={styles.customInputContainer}>
          <TextInput
            label="Describe your niche"
            value={customNiche}
            onChangeText={setCustomNiche}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="e.g., Sustainable fashion for eco-conscious consumers"
            style={styles.customInput}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedNiche || updateNicheMutation.isLoading || (showCustomInput && !customNiche.trim())}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
        >
          {updateNicheMutation.isLoading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            'Continue'
          )}
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back
        </Button>
      </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 24,
  },
  nichesContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  nicheCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cardContent: {
    padding: spacing.md,
  },
  nicheHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  nicheName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  customInputContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  customInput: {
    backgroundColor: theme.colors.surface,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignSelf: 'center',
  },
});

export default NicheSelectionScreen;
