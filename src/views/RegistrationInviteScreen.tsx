import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { TeamBadge } from '../components/competition/TeamBadge';
import { ProfileCard, ProfileField, RowDivider } from '../components/profile/ProfileSection';
import { BootstrapLoader, LoadState } from '../components/profile/ProfileStatus';
import { useAuthSession } from '../auth/AuthSessionContext';
import { GO_CHAMPS_ORIGIN } from '../core/linking/goChampsLinks';
import { RegistrationBrand, RegistrationCustomField } from '../domain/repositories/RegistrationRepository';
import { maskDate, maskDateTime } from '../domain/usecases/shared/registrationForm';
import { RootStackParamList } from '../navigation/types';
import { makeStyles, useTheme } from '../theme/theme';
import { useRegistrationInviteViewModel } from '../viewmodels/RegistrationInviteViewModel';

type Props = { route: RouteProp<RootStackParamList, 'RegistrationInviteScreen'> };
type Model = ReturnType<typeof useRegistrationInviteViewModel>;

const WINDOW_MESSAGES = {
  notStarted: 'As inscrições para este time ainda não abriram.',
  ended: 'As inscrições para este time foram encerradas.',
};

/** Ficha de inscrição: a team roster invite, answered with the athlete's account. */
const RegistrationInviteScreen: React.FC<Props> = ({ route }) => {
  const { inviteId } = route.params;
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, bootstrapping } = useAuthSession();
  const model = useRegistrationInviteViewModel(inviteId, user);

  const goHome = () => navigation.popToTop();

  if (bootstrapping) return <BootstrapLoader />;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ContentShell style={styles.content}>
            <LoadState loading={model.loading} error={model.error} onRetry={model.retry}>
              {model.invite ? (
                <>
                  <InviteHeader
                    organization={model.invite.organization}
                    tournament={model.invite.tournament}
                    team={model.invite.team}
                  />
                  {model.submitted ? (
                    <SubmittedCard approved={model.approved} onDone={goHome} />
                  ) : model.window !== 'open' ? (
                    <Notice icon="time-outline" text={WINDOW_MESSAGES[model.window]} />
                  ) : !user ? (
                    <SignInCard
                      onSignIn={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })}
                      onAnswerOnSite={() => void WebBrowser.openBrowserAsync(`${GO_CHAMPS_ORIGIN}/Invite/${inviteId}`)}
                    />
                  ) : (
                    <InviteForm model={model} fields={model.invite.registration.customFields} />
                  )}
                </>
              ) : (
                <>
                  <EmptyState
                    icon="mail-unread-outline"
                    title="Convite não encontrado"
                    description="O link pode ter expirado ou sido removido pelo organizador."
                  />
                  <TouchableOpacity accessibilityRole="button" onPress={goHome} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Ir para o início</Text>
                  </TouchableOpacity>
                </>
              )}
            </LoadState>
          </ContentShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

type HeaderProps = {
  organization: RegistrationBrand | null;
  tournament: RegistrationBrand | null;
  team: RegistrationBrand | null;
};

// A logo that is missing, or fails to load, takes no room.
const Logo = ({ brand, size, label }: { brand: RegistrationBrand; size: number; label: string }) => {
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  if (!brand.logoUrl || failed) return null;
  return (
    <Image
      accessibilityLabel={`${label} ${brand.name}`}
      source={{ uri: brand.logoUrl }}
      onError={() => setFailed(true)}
      resizeMode="contain"
      style={[styles.logo, { width: size, height: size }]}
    />
  );
};

const InviteHeader = ({ organization, tournament, team }: HeaderProps) => {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>FICHA DE INSCRIÇÃO</Text>
      {organization ? (
        <View style={styles.organization}>
          <Logo brand={organization} size={24} label="Logo da organização" />
          <Text style={styles.organizationName}>{organization.name}</Text>
        </View>
      ) : null}
      {tournament ? (
        <>
          <Logo brand={tournament} size={64} label="Logo do campeonato" />
          <Text style={styles.title}>{tournament.name}</Text>
        </>
      ) : null}
      {team ? (
        <View style={styles.team}>
          <TeamBadge logoUrl={team.logoUrl} name={team.name} size={56} />
          <Text style={styles.teamName}>{team.name}</Text>
        </View>
      ) : null}
    </View>
  );
};

const Notice = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Ionicons name={icon} size={18} color={theme.colors.textPrimary} />
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
};

const SignInCard = ({ onSignIn, onAnswerOnSite }: { onSignIn: () => void; onAnswerOnSite: () => void }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Entre para se inscrever</Text>
      <Text style={styles.body}>
        Com sua conta, seu nome e e-mail já vêm preenchidos e a inscrição fica ligada ao seu perfil de atleta.
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={onSignIn} style={styles.primaryButton}>
        <Ionicons name="log-in-outline" size={18} color={theme.colors.onAccent} />
        <Text style={styles.primaryButtonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onAnswerOnSite} style={styles.textButton}>
        <Text style={styles.textButtonText}>Responder sem conta</Text>
      </TouchableOpacity>
    </View>
  );
};

const SubmittedCard = ({ approved, onDone }: { approved: boolean; onDone: () => void }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View accessibilityLiveRegion="polite" style={styles.card}>
      <Ionicons name="checkmark-circle" size={40} color={theme.colors.success} />
      <Text style={styles.cardTitle}>{approved ? 'Inscrição aprovada' : 'Inscrição enviada'}</Text>
      <Text style={styles.body}>
        {approved
          ? 'Você está no time. Ele aparece no seu perfil de atleta em instantes.'
          : 'Aguardando aprovação do organizador. Depois de aprovada, ela aparece no seu perfil de atleta.'}
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={onDone} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Ir para o início</Text>
      </TouchableOpacity>
    </View>
  );
};

const InviteForm = ({ model, fields }: { model: Model; fields: RegistrationCustomField[] }) => {
  const theme = useTheme();
  const styles = useStyles();
  const { values, fieldErrors, submitting } = model;
  return (
    <View style={styles.form}>
      <ProfileCard>
        <ProfileField
          label="Nome completo"
          value={values.name}
          onChangeText={model.setName}
          placeholder={model.profileLoading ? 'Carregando seu perfil...' : 'Nome e sobrenome'}
          autoCapitalize="words"
          editable={!submitting}
          error={fieldErrors.name}
        />
        <RowDivider />
        <ProfileField
          label="E-mail"
          value={model.email ?? ''}
          onChangeText={() => undefined}
          editable={false}
          hint="O e-mail da sua conta."
        />
        <RowDivider />
        <ProfileField
          label="Número da camisa"
          value={values.shirtNumber}
          onChangeText={model.setShirtNumber}
          keyboardType="number-pad"
          maxLength={3}
          editable={!submitting}
        />
        {fields.map((field) => (
          <React.Fragment key={field.id}>
            <RowDivider />
            <CustomField field={field} model={model} />
          </React.Fragment>
        ))}
      </ProfileCard>
      {model.submitError ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {model.submitError}
        </Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={submitting ? 'Enviando' : 'Enviar inscrição'}
        accessibilityState={{ disabled: submitting, busy: submitting }}
        disabled={submitting}
        onPress={() => void model.submit()}
        style={[styles.primaryButton, submitting && styles.disabled]}
      >
        {submitting ? <ActivityIndicator size="small" color={theme.colors.onAccent} /> : null}
        <Text style={styles.primaryButtonText}>{submitting ? 'Enviando...' : 'Enviar inscrição'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const CustomField = ({ field, model }: { field: RegistrationCustomField; model: Model }) => {
  const value = model.values.custom[field.id];
  const typed = typeof value === 'string' ? value : '';
  const common = {
    label: field.required ? `${field.label} *` : field.label,
    hint: field.description ?? undefined,
    error: model.fieldErrors[field.id],
    editable: !model.submitting,
  };

  switch (field.type) {
    case 'consent':
      return <ConsentField field={field} model={model} label={common.label} error={common.error} />;
    case 'date':
      return (
        <ProfileField
          {...common}
          value={typed}
          onChangeText={(text) => model.setCustomValue(field.id, maskDate(text))}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
        />
      );
    case 'datetime':
      return (
        <ProfileField
          {...common}
          value={typed}
          onChangeText={(text) => model.setCustomValue(field.id, maskDateTime(text))}
          placeholder="DD/MM/AAAA HH:mm"
          keyboardType="number-pad"
          maxLength={16}
        />
      );
    case 'text':
      return (
        <ProfileField
          {...common}
          value={typed}
          onChangeText={(text) => model.setCustomValue(field.id, text)}
          autoCapitalize="sentences"
        />
      );
  }
};

type ConsentProps = { field: RegistrationCustomField; model: Model; label: string; error?: string };

// Like the CMS form: the document has to be opened before agreeing to it.
const ConsentField = ({ field, model, label, error }: ConsentProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const canAgree = !field.documentUrl || model.documentOpened(field.id);
  const openDocument = () => {
    model.markDocumentOpened(field.id);
    void WebBrowser.openBrowserAsync(field.documentUrl!);
  };

  return (
    <View style={styles.consent}>
      <Text style={styles.consentLabel}>{label}</Text>
      {field.description ? <Text style={styles.hint}>{field.description}</Text> : null}
      {field.documentUrl ? (
        <TouchableOpacity accessibilityRole="link" onPress={openDocument} style={styles.documentLink}>
          <Ionicons name="document-text-outline" size={16} color={theme.colors.olive} />
          <Text style={styles.textButtonText}>Ver documento</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.consentRow}>
        <Text style={[styles.consentAgree, !canAgree && styles.muted]}>
          {canAgree ? 'Li e concordo' : 'Abra o documento para concordar'}
        </Text>
        <Switch
          accessibilityLabel={`${field.label}: li e concordo`}
          value={model.values.custom[field.id] === true}
          onValueChange={(agreed) => model.setCustomValue(field.id, agreed)}
          disabled={!canAgree || model.submitting}
        />
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
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
  content: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
    textAlign: 'center',
  },
  organization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  organizationName: {
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  logo: {
    flexShrink: 0,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
    textAlign: 'center',
  },
  team: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
  },
  noticeText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    height: 52,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  secondaryButton: {
    alignSelf: 'center',
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.onOliveSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  textButton: {
    minHeight: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  consent: {
    paddingVertical: 12,
    paddingRight: theme.spacing.sm,
    gap: 6,
  },
  consentLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: theme.colors.subtleText,
    fontSize: 12,
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: theme.layout.touchTarget,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  consentAgree: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  muted: {
    color: theme.colors.subtleText,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
}));

export default RegistrationInviteScreen;
