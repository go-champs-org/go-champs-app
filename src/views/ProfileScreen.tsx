import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  const {
    loading,
    saving,
    error,
    account,
    athlete,
    athleteMissing,
    createAthlete,
    updateAthlete,
  } = useProfileViewModel(user?.username);
  const [athleteName, setAthleteName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  const startEditing = () => {
    if (!athlete) return;
    setEditName(athlete.name || '');
    setEditInstagram(athlete.instagram || '');
    setEditFacebook(athlete.facebook || '');
    setEditTwitter(athlete.twitter || '');
    setEditPhotoUrl(athlete.photo_url || '');
    setSaveMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (athlete) {
      setEditName(athlete.name || '');
      setEditInstagram(athlete.instagram || '');
      setEditFacebook(athlete.facebook || '');
      setEditTwitter(athlete.twitter || '');
      setEditPhotoUrl(athlete.photo_url || '');
    }
    setEditing(false);
    setSaveMessage(null);
  };

  const saveAthlete = async () => {
    const ok = await updateAthlete({
      name: editName,
      instagram: editInstagram.trim() || null,
      facebook: editFacebook.trim() || null,
      twitter: editTwitter.trim() || null,
      photo_url: editPhotoUrl.trim() || null,
    });
    if (ok) {
      setEditing(false);
      setSaveMessage('Perfil de atleta atualizado.');
    }
  };

  return (
    <Screen>
      <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ContentShell style={styles.container}>
            <View style={styles.card}>
              <View style={styles.icon}>
                <Ionicons name="checkmark-circle-outline" size={26} color={theme.colors.success} />
              </View>
              <Text style={styles.kicker}>CONTA</Text>
              <Text style={styles.title}>Olá, {account?.username || user.username}</Text>
              <Text style={styles.body}>{account?.email || user.email}</Text>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Alterar e-mail ou senha"
                onPress={() => navigation.navigate('WebAuthFlowScreen', { purpose: 'accountCredentials' })}
                style={styles.linkButton}
              >
                <Ionicons name="key-outline" size={16} color={theme.colors.success} />
                <Text style={styles.linkButtonText}>Alterar e-mail ou senha</Text>
              </TouchableOpacity>

              {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.accent} /> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}

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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Perfil de atleta</Text>
                  {athlete && !editing ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Editar perfil de atleta"
                      onPress={startEditing}
                    >
                      <Text style={styles.editLink}>Editar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {athlete && !editing ? (
                  <View style={styles.athleteView}>
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
                        <Text style={styles.meta}>@{athlete.username}</Text>
                      </View>
                    </View>
                    {athlete.instagram ? <Text style={styles.meta}>Instagram: {athlete.instagram}</Text> : null}
                    {athlete.facebook ? <Text style={styles.meta}>Facebook: {athlete.facebook}</Text> : null}
                    {athlete.twitter ? <Text style={styles.meta}>Twitter/X: {athlete.twitter}</Text> : null}
                    {athlete.tournaments?.length ? (
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Torneios</Text>
                        {athlete.tournaments.map((tournament) => (
                          <Text key={tournament.id} style={styles.meta}>
                            {tournament.name}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {athlete.career_stats?.length ? (
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Estatísticas de carreira</Text>
                        {athlete.career_stats.map((stat, index) => (
                          <Text key={stat.id || `${stat.title}-${index}`} style={styles.meta}>
                            {stat.title}: {stat.value ?? '-'}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => navigation.navigate('MyGamesTab')}
                      style={styles.linkButton}
                    >
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.success} />
                      <Text style={styles.linkButtonText}>Ver minha agenda de jogos</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {athlete && editing ? (
                  <View style={styles.createBox}>
                    <Field label="Nome" value={editName} onChangeText={setEditName} placeholder="Nome do atleta" />
                    <Field
                      label="Instagram"
                      value={editInstagram}
                      onChangeText={setEditInstagram}
                      placeholder="@usuario"
                      autoCapitalize="none"
                    />
                    <Field
                      label="Facebook"
                      value={editFacebook}
                      onChangeText={setEditFacebook}
                      placeholder="facebook.com/..."
                      autoCapitalize="none"
                    />
                    <Field
                      label="Twitter / X"
                      value={editTwitter}
                      onChangeText={setEditTwitter}
                      placeholder="@usuario"
                      autoCapitalize="none"
                    />
                    <Field
                      label="URL da foto"
                      value={editPhotoUrl}
                      onChangeText={setEditPhotoUrl}
                      placeholder="https://..."
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={saving}
                      onPress={() => void saveAthlete()}
                      style={[styles.secondaryButton, saving && styles.disabled]}
                    >
                      <Text style={styles.secondaryButtonText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" onPress={cancelEditing} style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {athleteMissing ? (
                  <View style={styles.createBox}>
                    <Text style={styles.meta}>
                      Você ainda não tem perfil de atleta. Crie um para liberar a agenda em Meus jogos.
                    </Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.mutedText}
      style={styles.input}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
    />
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
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
  linkButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  linkButtonText: {
    color: theme.colors.success,
    fontSize: theme.typography.bodySmall,
    fontWeight: '800',
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
  success: {
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  editLink: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '900',
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
  athleteView: {
    gap: theme.spacing.sm,
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
  subSection: {
    marginTop: theme.spacing.xs,
    gap: 2,
  },
  subSectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
    marginBottom: 2,
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
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    fontWeight: '800',
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
  cancelButton: {
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  cancelButtonText: {
    color: theme.colors.success,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ProfileScreen;
