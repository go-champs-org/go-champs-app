import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

type Props = {
  greeting?: string;
  initials?: string;
  onProfilePress?: () => void;
};

export const AppHeader = ({ greeting, initials, onProfilePress }: Props) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.identity}>
        {initials ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        ) : (
          <Text style={styles.logo}>
            GO <Text style={styles.logoDot}>•</Text> CHAMPS
          </Text>
        )}
        {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        onPress={onProfilePress}
        style={styles.profileButton}
      >
        <Ionicons name="person-circle-outline" size={30} color="#ffffff" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    minHeight: 72,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logo: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  logoDot: {
    color: theme.colors.accent,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  greeting: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
