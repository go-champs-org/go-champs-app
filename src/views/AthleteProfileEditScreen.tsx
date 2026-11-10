import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { ContentShell } from '../components/layout/ContentShell';
import { AthleteProfileSection } from '../components/profile/AthleteProfileSection';
import { BootstrapLoader, LoadState, SignInPrompt } from '../components/profile/ProfileStatus';
import { makeStyles } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useProfileViewModel } from '../viewmodels/ProfileViewModel';

/** Editar perfil: the athlete profile form, opened from the Perfil tab. */
const AthleteProfileEditScreen = () => {
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const { user, bootstrapping } = useAuthSession();
  const model = useProfileViewModel(user?.username, { editOnLoad: true });

  // Saving or cancelling goes back to the Perfil tab, which shows the result.
  const athlete = {
    ...model.athlete,
    cancelEdit: () => navigation.goBack(),
    save: async () => {
      const notice = model.athlete.data ? 'Perfil de atleta atualizado.' : 'Perfil de atleta criado.';
      const saved = await model.athlete.save();
      if (saved) navigation.popTo('MainTabs', { screen: 'ProfileTab', params: { savedNotice: notice } });
      return saved;
    },
  };

  if (bootstrapping) return <BootstrapLoader />;

  return (
    <Screen>
      {!user ? (
        <SignInPrompt />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ContentShell style={styles.content}>
              <LoadState loading={model.loading} error={model.error} onRetry={model.refresh}>
                <AthleteProfileSection athlete={athlete} />
              </LoadState>
            </ContentShell>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  content: {
    paddingTop: theme.spacing.lg,
  },
}));

export default AthleteProfileEditScreen;
