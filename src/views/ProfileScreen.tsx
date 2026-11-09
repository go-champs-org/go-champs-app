import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { ContentShell } from '../components/layout/ContentShell';
import {
  EmptyProfileCard,
  ProfileCard,
  ProfileField,
  ProfileRow,
  ProfileSection,
  RowDivider,
  SectionActions,
} from '../components/profile/ProfileSection';
import { makeStyles, useTheme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useProfileViewModel } from '../viewmodels/ProfileViewModel';
import { maskBirthDate, maskCpf, maskedDocument } from '../domain/usecases/shared/accountIdentityForm';
import { localFileFromPicked } from '../domain/usecases/shared/athleteProfileForm';

type ProfileModel = ReturnType<typeof useProfileViewModel>;

const ProfileScreen = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const { user, bootstrapping, signOut } = useAuthSession();
  const model = useProfileViewModel(user?.username);

  if (bootstrapping) {
    return (
      <Screen>
        <AppHeader />
        <ContentShell style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
        </ContentShell>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader />
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
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader />
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
            {model.notice ? (
              <View accessibilityLiveRegion="polite" style={styles.notice}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.noticeText}>{model.notice}</Text>
              </View>
            ) : null}

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

            {model.loading ? (
              <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
            ) : model.error ? (
              <View style={styles.retry}>
                <Text style={styles.retryText}>{model.error}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={model.refresh} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <IdentitySection identity={model.identity} />
                <AthleteSection athlete={model.athlete} />
              </>
            )}

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

const IdentitySection = ({ identity }: { identity: ProfileModel['identity'] }) => {
  const { data, editing, values, fieldErrors } = identity;
  const footnote = 'Seus dados de identidade não aparecem no seu perfil.';

  if (editing) {
    return (
      <ProfileSection title="Dados de identidade" isPrivate footnote={footnote}>
        <ProfileCard>
          <ProfileField
            label="Nome completo"
            value={values.fullLegalName}
            onChangeText={(value) => identity.setField('fullLegalName', value)}
            placeholder="Como no documento"
            autoCapitalize="words"
            editable={!identity.saving}
            error={fieldErrors.fullLegalName}
          />
          <ProfileField
            label="CPF"
            value={maskCpf(values.taxId)}
            onChangeText={(value) => identity.setField('taxId', value.replace(/\D/g, ''))}
            placeholder="000.000.000-00"
            hint={data?.tax_id_last4 ? `Termina em ${data.tax_id_last4}. Deixe em branco para manter.` : undefined}
            keyboardType="number-pad"
            maxLength={14}
            editable={!identity.saving}
            error={fieldErrors.taxId}
          />
          <ProfileField
            label="RG"
            value={values.governmentId}
            onChangeText={(value) => identity.setField('governmentId', value)}
            placeholder="Número do RG"
            hint={
              data?.government_id_last4
                ? `Termina em ${data.government_id_last4}. Deixe em branco para manter.`
                : undefined
            }
            autoCapitalize="characters"
            editable={!identity.saving}
            error={fieldErrors.governmentId}
          />
          <ProfileField
            label="Data de nascimento"
            value={values.dateOfBirth}
            onChangeText={(value) => identity.setField('dateOfBirth', maskBirthDate(value))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            editable={!identity.saving}
            error={fieldErrors.dateOfBirth}
          />
          <SectionActions
            saving={identity.saving}
            error={identity.error}
            onCancel={identity.cancelEdit}
            onSave={() => void identity.save()}
          />
        </ProfileCard>
      </ProfileSection>
    );
  }

  if (!identity.hasData || !data) {
    return (
      <ProfileSection title="Dados de identidade" isPrivate footnote={footnote}>
        <EmptyProfileCard
          title="Nenhum dado de identidade ainda"
          description="Adicione seu nome completo, CPF, RG e data de nascimento."
          actionLabel="Adicionar dados de identidade"
          onAction={identity.startEdit}
        />
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Dados de identidade"
      isPrivate
      onEdit={identity.startEdit}
      editLabel="Editar dados de identidade"
      footnote={footnote}
    >
      <ProfileCard>
        <ProfileRow label="Nome completo" value={data.full_legal_name} />
        <RowDivider />
        <ProfileRow label="CPF" value={maskedDocument(data.tax_id_last4)} />
        <RowDivider />
        <ProfileRow label="RG" value={maskedDocument(data.government_id_last4)} />
        <RowDivider />
        <ProfileRow label="Data de nascimento" value={formatLongDate(data.date_of_birth)} />
      </ProfileCard>
    </ProfileSection>
  );
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "1997-05-21" -> "21 mai 1997", as the mockup shows it. */
const formatLongDate = (iso: string | null) => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}` : null;
};

const AthleteSection = ({ athlete }: { athlete: ProfileModel['athlete'] }) => {
  const theme = useTheme();
  const styles = useStyles();
  const { data, editing, values, fieldErrors } = athlete;
  const description = 'Como você aparece para a comunidade Go Champs.';

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (asset) athlete.selectPhoto(localFileFromPicked(asset));
  };

  const photo = (
    <View style={styles.photo}>
      {athlete.photoUri ? (
        <Image accessibilityLabel="Foto do perfil" source={{ uri: athlete.photoUri }} style={styles.photoImage} />
      ) : (
        <Ionicons name="camera-outline" size={24} color={theme.colors.onOliveSoft} />
      )}
    </View>
  );

  if (editing) {
    return (
      <ProfileSection title="Perfil de atleta" description={description}>
        <ProfileCard>
          <View style={styles.photoRow}>
            {photo}
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Foto do perfil</Text>
              {fieldErrors.photo ? <Text style={styles.photoError}>{fieldErrors.photo}</Text> : null}
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={athlete.photoUri ? 'Trocar foto' : 'Adicionar foto'}
                disabled={athlete.saving}
                onPress={() => void pickPhoto()}
                style={styles.photoButton}
              >
                <Text style={styles.photoButtonText}>{athlete.photoUri ? 'Trocar' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {athlete.photoUri ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Remover foto"
                  disabled={athlete.saving}
                  onPress={athlete.removePhoto}
                  style={styles.photoButton}
                >
                  <Text style={[styles.photoButtonText, styles.removeText]}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <RowDivider />
          <ProfileField
            label="Nome de atleta"
            value={values.name}
            onChangeText={(value) => athlete.setField('name', value)}
            placeholder="Nome que aparece nos campeonatos"
            autoCapitalize="words"
            editable={!athlete.saving}
            error={fieldErrors.name}
          />
          <ProfileField
            label="Facebook"
            value={values.facebook}
            onChangeText={(value) => athlete.setField('facebook', value)}
            placeholder="usuario ou link"
            editable={!athlete.saving}
            error={fieldErrors.facebook}
          />
          <ProfileField
            label="Instagram"
            value={values.instagram}
            onChangeText={(value) => athlete.setField('instagram', value)}
            placeholder="@usuario"
            editable={!athlete.saving}
            error={fieldErrors.instagram}
          />
          <ProfileField
            label="Twitter"
            value={values.twitter}
            onChangeText={(value) => athlete.setField('twitter', value)}
            placeholder="@usuario"
            editable={!athlete.saving}
            error={fieldErrors.twitter}
          />
          <SectionActions
            saving={athlete.saving}
            error={athlete.error}
            onCancel={athlete.cancelEdit}
            onSave={() => void athlete.save()}
            saveLabel={data ? 'Salvar' : 'Criar perfil'}
          />
        </ProfileCard>
      </ProfileSection>
    );
  }

  if (!data) {
    return (
      <ProfileSection title="Perfil de atleta" description={description}>
        <EmptyProfileCard
          title="Nenhum perfil de atleta ainda"
          description="Adicione seu nome de atleta e uma foto, depois vincule Facebook, Instagram e Twitter."
          actionLabel="Criar perfil de atleta"
          onAction={athlete.startEdit}
        />
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Perfil de atleta"
      description={description}
      onEdit={athlete.startEdit}
      editLabel="Editar perfil de atleta"
    >
      <ProfileCard>
        <ProfileRow
          label="Foto do perfil"
          value={data.photo_url ? 'Foto adicionada' : null}
          placeholder="Nenhuma foto adicionada"
          leading={photo}
        />
        <RowDivider />
        <ProfileRow label="Nome de atleta" value={data.name} />
        <RowDivider />
        <ProfileRow label="Facebook" value={data.facebook} />
        <RowDivider />
        <ProfileRow label="Instagram" value={data.instagram} />
        <RowDivider />
        <ProfileRow label="Twitter" value={data.twitter} />
      </ProfileCard>
    </ProfileSection>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.md,
  },
  photo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: 54,
    height: 54,
  },
  photoCopy: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  photoError: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  photoActions: {
    alignItems: 'flex-end',
  },
  photoButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  photoButtonText: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '600',
  },
  removeText: {
    color: theme.colors.danger,
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

export default ProfileScreen;
