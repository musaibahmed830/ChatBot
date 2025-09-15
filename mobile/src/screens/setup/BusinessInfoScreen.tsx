import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  TextInput,
  Chip,
} from 'react-native-paper';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { theme, spacing } from '../../theme/theme';
import { apiClient } from '../../services/api';

interface RouteParams {
  categoryId: string;
  nicheId?: string;
  customNiche?: string;
}

interface BusinessInfo {
  businessName: string;
  businessType: string;
  targetAudience: string;
  keyProducts: string[];
  businessGoals: string[];
}

const BusinessInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, nicheId, customNiche } = route.params as RouteParams;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    businessType: '',
    targetAudience: '',
    keyProducts: [],
    businessGoals: []
  });
  
  const [newProduct, setNewProduct] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const updateBusinessInfoMutation = useMutation(
    async (businessData: any) => {
      const response = await apiClient.put('/categories/settings', {
        businessInfo: businessData
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile');
        navigation.navigate('Dashboard');
      },
    }
  );

  const handleAddProduct = () => {
    if (newProduct.trim()) {
      setBusinessInfo(prev => ({
        ...prev,
        keyProducts: [...prev.keyProducts, newProduct.trim()]
      }));
      setNewProduct('');
    }
  };

  const handleRemoveProduct = (index: number) => {
    setBusinessInfo(prev => ({
      ...prev,
      keyProducts: prev.keyProducts.filter((_, i) => i !== index)
    }));
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setBusinessInfo(prev => ({
        ...prev,
        businessGoals: [...prev.businessGoals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setBusinessInfo(prev => ({
      ...prev,
      businessGoals: prev.businessGoals.filter((_, i) => i !== index)
    }));
  };

  const handleContinue = () => {
    updateBusinessInfoMutation.mutate(businessInfo);
  };

  const isFormValid = businessInfo.businessName.trim() && businessInfo.businessType.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Business Information</Title>
          <Paragraph style={styles.subtitle}>
            Help us customize your chatbot with your business details
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Business Name *"
              value={businessInfo.businessName}
              onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, businessName: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Fashion Forward Store"
            />

            <TextInput
              label="Business Type *"
              value={businessInfo.businessType}
              onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, businessType: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Online Fashion Retailer"
            />

            <TextInput
              label="Target Audience"
              value={businessInfo.targetAudience}
              onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, targetAudience: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="e.g., Young professionals aged 25-35 who value sustainable fashion"
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Products/Services</Text>
              <View style={styles.addItemContainer}>
                <TextInput
                  label="Add product or service"
                  value={newProduct}
                  onChangeText={setNewProduct}
                  mode="outlined"
                  style={styles.addItemInput}
                  placeholder="e.g., Women's Dresses"
                />
                <Button
                  mode="contained"
                  onPress={handleAddProduct}
                  disabled={!newProduct.trim()}
                  style={styles.addButton}
                >
                  Add
                </Button>
              </View>
              
              <View style={styles.chipsContainer}>
                {businessInfo.keyProducts.map((product, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveProduct(index)}
                    style={styles.chip}
                    closeIcon="close"
                  >
                    {product}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Goals</Text>
              <View style={styles.addItemContainer}>
                <TextInput
                  label="Add business goal"
                  value={newGoal}
                  onChangeText={setNewGoal}
                  mode="outlined"
                  style={styles.addItemInput}
                  placeholder="e.g., Increase online sales by 30%"
                />
                <Button
                  mode="contained"
                  onPress={handleAddGoal}
                  disabled={!newGoal.trim()}
                  style={styles.addButton}
                >
                  Add
                </Button>
              </View>
              
              <View style={styles.chipsContainer}>
                {businessInfo.businessGoals.map((goal, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveGoal(index)}
                    style={styles.chip}
                    closeIcon="close"
                  >
                    {goal}
                  </Chip>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!isFormValid || updateBusinessInfoMutation.isLoading}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
          >
            {updateBusinessInfoMutation.isLoading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              'Complete Setup'
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
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
  card: {
    margin: spacing.lg,
    marginTop: spacing.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  addItemInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addButton: {
    paddingHorizontal: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.sm,
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

export default BusinessInfoScreen;
