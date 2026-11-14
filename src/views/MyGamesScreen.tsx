import React, { useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { RefreshNotice, themedRefreshControl } from '../components/feedback/RefreshFeedback';
import { BootstrapLoader, LoadState } from '../components/profile/ProfileStatus';
import {
  MyGamesHeader,
  MyGamesSectionHeading,
  NextGameCard,
  ResultCard,
  UpcomingGameCard,
} from '../components/myGames/MyGamesCards';
import { GameSticker } from '../components/myGames/GameSticker';
import { ShareStickerSheet } from '../components/share/ShareStickerSheet';
import { makeStyles, useTheme } from '../theme/theme';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useMyGamesViewModel } from '../viewmodels/MyGamesViewModel';
import { useShareStickerViewModel } from '../viewmodels/ShareStickerViewModel';
import { countdownLabel, monthHeading } from '../domain/usecases/shared/myGames';
import { GAME_SHARE_FORMATS, GameShareCard, GameShareFormat } from '../domain/usecases/shared/gameShare';

const SHARE_TITLE = 'Compartilhar jogo';

/** Meus jogos: the games of the athlete's teams, next first, then results. */
const MyGamesScreen = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const { user, bootstrapping } = useAuthSession();
  const model = useMyGamesViewModel(user?.username);
  const { recheckAthleteProfile } = model;
  // Back on this tab after creating the athlete profile: load the games.
  useFocusEffect(useCallback(() => recheckAthleteProfile(), [recheckAthleteProfile]));
  const share = useShareStickerViewModel<GameShareCard, GameShareFormat>({
    formats: GAME_SHARE_FORMATS,
    sticker: 'game',
    dialogTitle: SHARE_TITLE,
  });
  const openGame = (gameId: string) => navigation.navigate('GameDetailScreen', { gameId });

  const cta = (label: string, onPress: () => void) => (
    <TouchableOpacity accessibilityRole="button" style={styles.cta} onPress={onPress}>
      <Text style={styles.ctaText}>{label}</Text>
    </TouchableOpacity>
  );

  const body = () => {
    if (model.needsAuth) {
      return (
        <View>
          <EmptyState
            icon="calendar-clear-outline"
            title="Sua agenda começa aqui"
            description="Entre na sua conta para acompanhar jogos, horários e resultados."
          />
          {cta('Entrar', () => navigation.navigate('AuthScreen', { initialMode: 'signIn' }))}
        </View>
      );
    }
    if (model.needsAthleteProfile) {
      return (
        <View>
          <EmptyState
            icon="person-outline"
            title="Complete seu perfil de atleta"
            description="Crie seu perfil de atleta para ver os jogos dos seus times."
          />
          {cta('Criar perfil de atleta', () => navigation.navigate('AthleteProfileEditScreen'))}
        </View>
      );
    }
    return null;
  };

  const signedOutBody = body();

  return (
    <Screen>
      <AppHeader />
      {bootstrapping ? (
        <BootstrapLoader />
      ) : signedOutBody ? (
        <ContentShell style={styles.content}>{signedOutBody}</ContentShell>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={themedRefreshControl(theme, model.refreshing, () => model.refresh())}
        >
          {!model.loading && !model.error ? (
            <MyGamesHeader
              view={model.view}
              tournamentId={model.tournamentId}
              tournaments={model.tournaments}
              onSelectView={model.selectView}
              onSelectTournament={model.selectTournament}
            />
          ) : null}
          <ContentShell style={styles.content}>
            <RefreshNotice message={model.refreshError} />
            <LoadState loading={model.loading} error={model.error} onRetry={model.retry}>
              {!model.next && model.previous.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title={model.view === 'upcoming' ? 'Nenhum jogo próximo' : 'Nenhum jogo por aqui ainda'}
                  description={
                    model.tournaments.length === 0
                      ? 'Os jogos aparecem quando a organização vincula seu usuário ao elenco de um time.'
                      : 'Troque o filtro para ver outros jogos.'
                  }
                />
              ) : null}
              {model.next ? (
                <View style={styles.section}>
                  <MyGamesSectionHeading title="Próximo jogo" detail={countdownLabel(model.next, model.now)} />
                  <NextGameCard game={model.next} onOpen={() => openGame(model.next!.id)} />
                </View>
              ) : null}
              {model.upcoming.length > 0 ? (
                <View style={styles.section}>
                  <MyGamesSectionHeading title="Mais jogos" detail={monthHeading(model.upcoming[0].datetime)} />
                  {model.upcoming.map((game) => (
                    <UpcomingGameCard key={game.id} game={game} onOpen={() => openGame(game.id)} />
                  ))}
                </View>
              ) : null}
              {model.previous.length > 0 ? (
                <View style={styles.section}>
                  <MyGamesSectionHeading title="Jogos anteriores" detail="ÚLTIMOS RESULTADOS" />
                  {model.previous.map((recent) => (
                    <ResultCard
                      key={recent.game.id}
                      recent={recent}
                      onOpen={() => openGame(recent.game.id)}
                      onShare={() => share.open(model.shareCard(recent))}
                    />
                  ))}
                </View>
              ) : null}
              {model.next || model.previous.length > 0 ? (
                <Text style={styles.footnote}>Horários no fuso do local do jogo.</Text>
              ) : null}
            </LoadState>
          </ContentShell>
        </ScrollView>
      )}
      <ShareStickerSheet
        model={share}
        title={SHARE_TITLE}
        testID="game-share-sheet"
        renderSticker={(card, format, backgroundUri) => (
          <GameSticker card={card} format={format} backgroundUri={backgroundUri} />
        )}
      />
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
    paddingTop: 22,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  footnote: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  cta: {
    marginHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: theme.colors.onAccent,
    fontWeight: '900',
  },
}));

export default MyGamesScreen;
