import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useAuthSession } from '../../auth/AuthSessionContext';

type Props = {
  onProfilePress?: () => void;
};

export const AppHeader = ({ onProfilePress }: Props) => {
  const { user } = useAuthSession();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.container, user ? styles.containerAuthenticated : styles.containerGuest]}>
        <Image accessibilityLabel="Logo Go Champs" source={require('../../../assets/images/logo-white-name.png')} style={styles.logo} />
        {!user ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={onProfilePress}
            style={styles.profileButton}
          >
            <Ionicons name="person-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    minHeight: 68,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerGuest: { justifyContent: 'space-between' },
  containerAuthenticated: { justifyContent: 'center' },
  logo: {
    height: 52,
    width: 72,
    resizeMode: 'contain',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
