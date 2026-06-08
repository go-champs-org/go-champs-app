import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { theme } from '../theme/theme';

const ProfileScreen = () => (
  <Screen>
    <AppHeader />
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Perfil</Text>
        <Text style={styles.title}>Entre ou crie sua conta</Text>
        <Text style={styles.body}>Siga campeonatos, receba alertas e veja jogos ao vivo em uma experiência personalizada.</Text>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="person-outline" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>Entrar ou criar conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ProfileScreen;

