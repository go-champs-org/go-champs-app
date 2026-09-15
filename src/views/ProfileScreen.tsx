import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { theme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useProfileViewModel } from '../viewmodels/ProfileViewModel';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, bootstrapping, signOut } = useAuthSession();
  const { loading, saving, error, account, athlete, athleteMissing, createAthlete } = useProfileViewModel(
    user?.username
  );
  const [athleteName, setAthleteName] = useState('');

  if (bootstrapping) {
    return (
      <Screen>
        <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
        <ContentShell style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
        </ContentShell>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
        <ContentShell style={styles.container}>
          <View style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="person-outline" size={26} color={theme.colors.success} />
            </View>
            <Text style={styles.kicker}>PERFIL</Text>
            <Text style={styles.title}>Entre na sua conta</Text>
            <Text style={styles.body}>
              Acompanhe sua agenda, organizações e perfil de atleta em uma experiência personalizada.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })}
              style={styles.button}
            >
              <Ionicons name="log-in-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ContentShell>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
      <ContentShell style={styles.container}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="checkmark-circle-outline" size={26} color={theme.colors.success} />
          </View>
          <Text style={styles.kicker}>CONTA</Text>
          <Text style={styles.title}>Olá, {account?.username || user.username}</Text>
          <Text style={styles.body}>{account?.email || user.email}</Text>

          {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.accent} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {account?.organizations?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizações</Text>
              {account.organizations.map((organization) => (
                <Text key={organization.id} style={styles.rowText}>
                  {organization.name}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perfil de atleta</Text>
            {athlete ? (
              <View style={styles.athleteRow}>
                {athlete.photo_url ? (
                  <Image source={{ uri: athlete.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={18} color={theme.colors.textSecondary} />
                  </View>
                )}
                <View style={styles.athleteCopy}>
                  <Text style={styles.rowText}>{athlete.name}</Text>
                  {[athlete.instagram, athlete.facebook, athlete.twitter].filter(Boolean).length ? (
                    <Text style={styles.meta}>
                      {[athlete.instagram, athlete.facebook, athlete.twitter].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {athleteMissing ? (
              <View style={styles.createBox}>
                <Text style={styles.meta}>Você ainda não tem perfil de atleta. Crie um para ver sua agenda.</Text>
                <TextInput
                  value={athleteName}
                  onChangeText={setAthleteName}
                  placeholder="Nome do atleta"
                  placeholderTextColor={theme.colors.mutedText}
                  style={styles.input}
                  autoCapitalize="words"
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => createAthlete({ name: athleteName })}
                  style={[styles.secondaryButton, saving && styles.disabled]}
                >
                  <Text style={styles.secondaryButtonText}>{saving ? 'Salvando...' : 'Criar perfil de atleta'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <TouchableOpacity accessibilityRole="button" onPress={() => void signOut()} style={styles.button}>
            <Ionicons name="log-out-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.buttonText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ContentShell>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  icon: {
    width: 52,
    height: 52,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  rowText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  athleteCopy: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
  },
  avatarFallback: {
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBox: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  button: {
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ProfileScreen;
