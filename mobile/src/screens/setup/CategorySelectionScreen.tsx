import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { theme, spacing } from '../../theme/theme';
import { apiClient } from '../../services/api';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresNiche?: boolean;
}

const CategorySelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: categories, isLoading } = useQuery(
    'categories',
    async () => {
      const response = await apiClient.get('/categories');
      return response.data.data as Category[];
    }
  );

  const updateCategoryMutation = useMutation(
    async (categoryData: any) => {
      const response = await apiClient.put('/categories/settings', categoryData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile');
        if (selectedCategory && categories) {
          const category = categories.find(c => c.id === selectedCategory);
          if (category?.requiresNiche) {
            navigation.navigate('NicheSelection', { categoryId: selectedCategory });
          } else {
            navigation.navigate('BusinessInfo', { categoryId: selectedCategory });
          }
        }
      },
    }
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    updateCategoryMutation.mutate({ purpose: categoryId });
  };

  const getCategoryIcon = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      '💬': 'chat',
      '🛒': 'shopping-cart',
      '👥': 'people',
      '💼': 'work',
      '🔧': 'build',
      '📚': 'book',
      '🎭': 'theater-comedy',
      '🏥': 'local-hospital',
      '🏠': 'home',
      '💰': 'attach-money'
    };
    return iconMap[icon] || 'help';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Choose Your Purpose</Title>
        <Paragraph style={styles.subtitle}>
          Select how you want to use your chatbot
        </Paragraph>
      </View>

      <View style={styles.categoriesContainer}>
        {categories?.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handleCategorySelect(category.id)}
            disabled={updateCategoryMutation.isLoading}
          >
            <Card
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.selectedCard
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: category.color + '20' }
                    ]}
                  >
                    <Icon
                      name={getCategoryIcon(category.icon)}
                      size={32}
                      color={category.color}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Title style={styles.categoryName}>{category.name}</Title>
                    <Paragraph style={styles.categoryDescription}>
                      {category.description}
                    </Paragraph>
                    {category.requiresNiche && (
                      <Chip
                        mode="outlined"
                        compact
                        style={styles.requiresNicheChip}
                        textStyle={styles.chipText}
                      >
                        Requires Niche Selection
                      </Chip>
                    )}
                  </View>
                  <View style={styles.selectionIndicator}>
                    {selectedCategory === category.id && (
                      <Icon
                        name="check-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => {
            if (selectedCategory && categories) {
              const category = categories.find(c => c.id === selectedCategory);
              if (category?.requiresNiche) {
                navigation.navigate('NicheSelection', { categoryId: selectedCategory });
              } else {
                navigation.navigate('BusinessInfo', { categoryId: selectedCategory });
              }
            }
          }}
          disabled={!selectedCategory || updateCategoryMutation.isLoading}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
        >
          {updateCategoryMutation.isLoading ? (
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
  categoriesContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    elevation: 4,
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    lineHeight: 20,
  },
  requiresNicheChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    height: 24,
  },
  chipText: {
    fontSize: 10,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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

export default CategorySelectionScreen;
