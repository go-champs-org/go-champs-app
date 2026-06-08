import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { theme } from '../theme/theme';

const MyGamesScreen = () => (
  <Screen>
    <AppHeader />
    <View style={styles.container}>
      <Text style={styles.title}>Meus jogos</Text>
      <Text style={styles.body}>Entre na sua conta para acompanhar sua agenda de jogos.</Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 15,
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});

export default MyGamesScreen;

