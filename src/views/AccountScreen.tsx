import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { ContentShell } from '../components/layout/ContentShell';
import { ProfileCard, ProfileRow, ProfileSection, RowDivider } from '../components/profile/ProfileSection';
import { IdentitySection } from '../components/profile/IdentitySection';
import { BootstrapLoader, LoadState, SaveNotice, SignInPrompt } from '../components/profile/ProfileStatus';
import { makeStyles, useTheme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useAccountViewModel } from '../viewmodels/AccountViewModel';

/** Menu > Minha conta: account details, private identity data and sign out. */
const AccountScreen = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const { user, bootstrapping, signOut } = useAuthSession();
  const model = useAccountViewModel(user?.username);

  if (bootstrapping) {
    return (
      <Screen>
        <BootstrapLoader />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <SignInPrompt />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <ContentShell style={styles.heroContent}>
              <Text accessibilityRole="header" style={styles.heroTitle}>
                Sua conta
              </Text>
              <Text style={styles.heroSubtitle}>Seus dados. Sua identidade. Seu jogo.</Text>
            </ContentShell>
          </View>

          <ContentShell style={styles.content}>
            <SaveNotice notice={model.notice} />

            <ProfileSection title="Dados da conta">
              <ProfileCard>
                <ProfileRow label="Usuário" value={model.account?.username || user.username} />
                <RowDivider />
                <ProfileRow label="E-mail" value={model.account?.email || user.email} />
                <RowDivider />
                <ProfileRow
                  label="Senha"
                  value="Redefinir por e-mail"
                  action={{
                    label: 'Redefinir senha',
                    onPress: () => navigation.navigate('WebAuthFlowScreen', { purpose: 'accountRecovery' }),
                  }}
                />
              </ProfileCard>
            </ProfileSection>

            <LoadState loading={model.loading} error={model.error} onRetry={model.refresh}>
              <IdentitySection identity={model.identity} />
            </LoadState>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Você controla o que compartilha.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void signOut()} style={styles.signOut}>
                <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
                <Text style={styles.signOutText}>Sair da conta</Text>
              </TouchableOpacity>
            </View>
          </ContentShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const useStyles = makeStyles((theme) => ({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderBottomWidth: theme.dark ? 1 : 0,
    borderBottomColor: theme.colors.chromeBorder,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingTop: theme.spacing.md,
    paddingBottom: 28,
    gap: 7,
  },
  heroTitle: {
    color: theme.colors.onPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroSubtitle: {
    color: theme.colors.onPrimaryMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    paddingTop: theme.spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: 20,
    paddingTop: theme.spacing.xs,
  },
  footerText: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  signOut: {
    minHeight: theme.layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  signOutText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
}));

export default AccountScreen;
