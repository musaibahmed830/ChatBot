import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../theme/theme';

const ForgotPasswordScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Forgot Password Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default ForgotPasswordScreen;
