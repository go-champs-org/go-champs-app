import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { ContentShell } from '../components/layout/ContentShell';
import { AthleteProfileSection } from '../components/profile/AthleteProfileSection';
import { BootstrapLoader, LoadState, SaveNotice, SignInPrompt } from '../components/profile/ProfileStatus';
import { makeStyles } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useProfileViewModel } from '../viewmodels/ProfileViewModel';

/** The Perfil tab: the athlete profile, or sign in. Account data lives in the menu. */
const ProfileScreen = () => {
  const styles = useStyles();
  const { user, bootstrapping } = useAuthSession();
  const model = useProfileViewModel(user?.username);
  const { clearNotice } = model;
  // The Perfil tab stays mounted: drop the save message when leaving it.
  useFocusEffect(useCallback(() => clearNotice, [clearNotice]));

  return (
    <Screen>
      <AppHeader />
      {bootstrapping ? (
        <BootstrapLoader />
      ) : !user ? (
        <SignInPrompt />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ContentShell style={styles.content}>
              <SaveNotice notice={model.notice} />
              <LoadState loading={model.loading} error={model.error} onRetry={model.refresh}>
                <AthleteProfileSection athlete={model.athlete} />
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

export default ProfileScreen;
