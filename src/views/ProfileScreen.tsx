import React, { useCallback, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { ContentShell } from '../components/layout/ContentShell';
import { BootstrapLoader, LoadState, SaveNotice, SignInPrompt } from '../components/profile/ProfileStatus';
import {
  AthleteHero,
  CareerSummaryCard,
  MonthlyScoringCard,
  SectionHeading,
  TournamentCardItem,
} from '../components/profile/AthleteHomeSections';
import { RefreshNotice, themedRefreshControl } from '../components/feedback/RefreshFeedback';
import { EmptyState } from '../components/feedback/EmptyState';
import { makeStyles, useTheme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useAthleteHomeViewModel } from '../viewmodels/AthleteHomeViewModel';
import { MainTabParamList } from '../navigation/types';

/** The Perfil tab: the signed-in athlete's profile, career and tournaments. */
const ProfileScreen = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'ProfileTab'>>();
  const { user, bootstrapping } = useAuthSession();
  const model = useAthleteHomeViewModel(user?.username);
  const { clearNotice, acknowledgeSave } = model;
  // The Perfil tab stays mounted: drop the save message when leaving it.
  useFocusEffect(useCallback(() => clearNotice, [clearNotice]));

  // The edit screen comes back here with what it saved.
  const savedNotice = route.params?.savedNotice;
  useEffect(() => {
    if (!savedNotice) return;
    acknowledgeSave(savedNotice);
    navigation.setParams({ savedNotice: undefined });
  }, [savedNotice, acknowledgeSave, navigation]);

  const openEdit = () => navigation.navigate('AthleteProfileEditScreen');
  const profile = model.profile;

  return (
    <Screen>
      <AppHeader />
      {bootstrapping ? (
        <BootstrapLoader />
      ) : !user ? (
        <SignInPrompt />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={themedRefreshControl(theme, model.refreshing, () => model.refresh())}
        >
          <AthleteHero
            name={profile?.name || user.username}
            photoUrl={profile?.photo_url ?? null}
            socialLinks={model.socialLinks}
            editLabel={profile ? 'Editar perfil' : 'Criar perfil de atleta'}
            onEdit={openEdit}
          />
          <ContentShell style={styles.content}>
            <SaveNotice notice={model.notice} />
            <RefreshNotice message={model.refreshError} />
            <LoadState loading={model.loading} error={model.error} onRetry={model.retry}>
              {!profile ? (
                <EmptyState
                  icon="person-outline"
                  title="Nenhum perfil de atleta ainda"
                  description="Crie seu perfil de atleta para ver suas estatísticas, jogos e campeonatos."
                />
              ) : (
                <>
                  {model.summaries.length === 0 ? (
                    <View style={styles.section}>
                      <SectionHeading title="Resumo" />
                      <Text style={styles.emptyText}>
                        Suas estatísticas aparecem aqui depois do primeiro jogo registrado.
                      </Text>
                    </View>
                  ) : (
                    model.summaries.map((summary) => (
                      <View key={summary.sportSlug} style={styles.section}>
                        <SectionHeading title={`Resumo · ${summary.title}`} />
                        <CareerSummaryCard summary={summary} />
                        <MonthlyScoringCard bars={model.monthlyPoints[summary.sportSlug] ?? []} />
                      </View>
                    ))
                  )}
                  <View style={styles.section}>
                    <SectionHeading
                      title="Meus campeonatos"
                      action={
                        model.hasMoreTournaments
                          ? { label: model.showAllTournaments ? 'Ver menos' : 'Ver todos', onPress: model.toggleTournaments }
                          : undefined
                      }
                    />
                    {model.tournaments.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Nenhum campeonato ainda. Peça à organização para vincular seu usuário ao elenco do time.
                      </Text>
                    ) : (
                      model.tournaments.map((card) => (
                        <TournamentCardItem
                          key={card.key}
                          card={card}
                          onOpen={() => navigation.navigate('TournamentScreen', { tournamentId: card.tournamentId })}
                        />
                      ))
                    )}
                  </View>
                </>
              )}
            </LoadState>
          </ContentShell>
        </ScrollView>
      )}
    </Screen>
  );
};

const useStyles = makeStyles((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  section: {
    gap: 12,
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
}));

export default ProfileScreen;
