import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { AppHeader } from '../components/layout/AppHeader';
import { theme } from '../theme/theme';
import { EmptyState } from '../components/feedback/EmptyState';
import { ContentShell } from '../components/layout/ContentShell';
import { useAuthSession } from '../auth/AuthSessionContext';
import { useMyGamesViewModel } from '../viewmodels/MyGamesViewModel';
import { ScheduleGame } from '../domain/repositories/AthleteProfileRepository';

const formatDate = (value: string | null) => {
  if (!value) return 'Data a definir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const GameCard = ({ game }: { game: ScheduleGame }) => {
  const home = game.home_team?.name || game.home_placeholder || 'A definir';
  const away = game.away_team?.name || game.away_placeholder || 'A definir';
  const score =
    game.is_finished || game.home_score != null || game.away_score != null
      ? `${game.home_score ?? '-'} x ${game.away_score ?? '-'}`
      : 'vs';

  return (
    <View style={styles.card}>
      <Text style={styles.tournament}>{game.tournament?.name || 'Torneio'}</Text>
      <Text style={styles.match}>
        {home} {score} {away}
      </Text>
      <Text style={styles.meta}>{formatDate(game.datetime)}</Text>
      {game.location || game.city ? (
        <Text style={styles.meta}>
          {[game.location, game.city, game.court].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
};

const MyGamesScreen = () => {
  const navigation = useNavigation<any>();
  const { user, bootstrapping } = useAuthSession();
  const { loading, error, games, needsAuth, needsAthleteProfile } = useMyGamesViewModel(Boolean(user));

  return (
    <Screen>
      <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
      <ContentShell style={styles.container}>
        <Text style={styles.eyebrow}>SUA AGENDA</Text>
        <Text style={styles.title}>Meus jogos</Text>

        {bootstrapping || loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {needsAuth ? (
          <View>
            <EmptyState
              icon="calendar-clear-outline"
              title="Sua agenda começa aqui"
              description="Entre na sua conta para acompanhar jogos, horários e resultados."
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.cta}
              onPress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })}
            >
              <Text style={styles.ctaText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {needsAthleteProfile ? (
          <View>
            <EmptyState
              icon="person-outline"
              title="Complete seu perfil de atleta"
              description="Crie seu perfil de atleta para liberar a agenda de jogos."
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.cta}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Text style={styles.ctaText}>Ir para o perfil</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!needsAuth && !needsAthleteProfile && !loading && games.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nenhum jogo na sua agenda ainda"
            description="Quando houver partidas vinculadas ao seu perfil, elas aparecem aqui."
          />
        ) : null}

        {!needsAuth && !needsAthleteProfile && games.length > 0 ? (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <GameCard game={item} />}
          />
        ) : null}
      </ContentShell>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
    marginTop: 2,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
  error: {
    marginTop: theme.spacing.md,
    color: '#B42318',
    fontWeight: '700',
  },
  list: {
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    gap: 4,
    ...theme.shadow.card,
  },
  tournament: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  match: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
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
    color: theme.colors.primary,
    fontWeight: '900',
  },
});

export default MyGamesScreen;
