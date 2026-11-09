import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContentShell } from '../layout/ContentShell';
import { makeStyles, useTheme } from '../../theme/theme';

/** Shown on the account and profile screens when nobody is signed in. */
export const SignInPrompt = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  return (
    <ContentShell style={styles.signedOut}>
      <View style={styles.signedOutCard}>
        <View style={styles.icon}>
          <Ionicons name="person-outline" size={26} color={theme.colors.success} />
        </View>
        <Text style={styles.kicker}>PERFIL</Text>
        <Text style={styles.signedOutTitle}>Entre na sua conta</Text>
        <Text style={styles.body}>
          Acompanhe sua agenda, organizações e perfil de atleta em uma experiência personalizada.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })}
          style={styles.button}
        >
          <Ionicons name="log-in-outline" size={18} color={theme.colors.onAccent} />
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </ContentShell>
  );
};

export const BootstrapLoader = () => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <ContentShell style={styles.centered}>
      <ActivityIndicator color={theme.colors.accent} />
    </ContentShell>
  );
};

/** The success message after a save. */
export const SaveNotice = ({ notice }: { notice: string | null }) => {
  const theme = useTheme();
  const styles = useStyles();
  if (!notice) return null;
  return (
    <View accessibilityLiveRegion="polite" style={styles.notice}>
      <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
      <Text style={styles.noticeText}>{notice}</Text>
    </View>
  );
};

type LoadStateProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
};

/** A spinner while loading, the error with a retry, else the content. */
export const LoadState = ({ loading, error, onRetry, children }: LoadStateProps) => {
  const theme = useTheme();
  const styles = useStyles();
  if (loading) return <ActivityIndicator style={styles.loader} color={theme.colors.accent} />;
  if (error) {
    return (
      <View style={styles.retry}>
        <Text style={styles.retryText}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <>{children}</>;
};

const useStyles = makeStyles((theme) => ({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: 20,
    marginBottom: theme.spacing.md,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
  },
  noticeText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: theme.spacing.lg,
  },
  retry: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  retryText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: theme.colors.onOliveSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  signedOut: {
    flex: 1,
    padding: theme.spacing.md,
  },
  signedOutCard: {
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
  signedOutTitle: {
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
    color: theme.colors.onAccent,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
}));
