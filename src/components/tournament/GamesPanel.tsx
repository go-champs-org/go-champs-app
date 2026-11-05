import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Game } from '../../models/GameModel';
import { formatGameTime } from '../../domain/usecases/shared/gameDateTime';
import { isLiveGame, showsScore } from '../../domain/usecases/shared/liveScore';
import { teamShortName } from '../../domain/usecases/shared/phasePresentation';
import { useLiveScore } from '../../viewmodels/LiveScoreViewModel';
import { LiveBadge } from '../competition/LiveBadge';
import { TeamBadge } from '../competition/TeamBadge';
import { theme } from '../../theme/theme';

type Props = {
  phaseTitle: string;
  dateKeys: string[];
  selectedDate: string | null;
  onSelectDate: (value: string) => void;
  games: Game[];
  onPressGame: (gameId: string) => void;
  apiBaseUrl?: string;
};

const UNDECIDED = 'A definir';

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

type Emphasis = 'winner' | 'loser' | 'neutral';

// The winner carries the row in full weight; the side it beat steps back.
const emphasisOf = (finished: boolean, own: number, other: number): Emphasis => {
  if (!finished || own === other) return 'neutral';
  return own > other ? 'winner' : 'loser';
};

type SideProps = { name: string; logoUrl?: string | null; score: number | null; emphasis: Emphasis };

const GameSide = ({ name, logoUrl, score, emphasis }: SideProps) => (
  <View style={styles.side}>
    {logoUrl ? <TeamBadge logoUrl={logoUrl} name={name} size={20} /> : null}
    <Text numberOfLines={1} style={[styles.sideName, styles[emphasis]]}>{name}</Text>
    <Text style={[styles.sideScore, styles[emphasis]]}>{score ?? ''}</Text>
  </View>
);

type GameRowProps = { game: Game; apiBaseUrl?: string; onPress: () => void };

// One game as the public "Partidas" card prints it: time and a live badge,
// the venue, then each side by logo and short name with its score.
const GameRow = ({ game, apiBaseUrl, onPress }: GameRowProps) => {
  const live = isLiveGame(game.live_state);
  const score = useLiveScore(game.id, live, { homeScore: game.home_score, awayScore: game.away_score }, apiBaseUrl);
  const shown = showsScore(game);
  const homeName = teamShortName(game.home_team ?? undefined, game.home_placeholder, UNDECIDED);
  const awayName = teamShortName(game.away_team ?? undefined, game.away_placeholder, UNDECIDED);
  const fullHome = game.home_team?.name || game.home_placeholder || UNDECIDED;
  const fullAway = game.away_team?.name || game.away_placeholder || UNDECIDED;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir jogo ${fullHome} versus ${fullAway}`}
      onPress={onPress}
      style={styles.game}
    >
      <View style={styles.meta}>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatGameTime(game.datetime)}</Text>
          {live ? <LiveBadge /> : null}
        </View>
        {game.location ? <Text numberOfLines={1} style={styles.venue}>{game.location}</Text> : null}
      </View>
      <GameSide
        name={homeName}
        logoUrl={game.home_team?.logo_url}
        score={shown ? score.homeScore : null}
        emphasis={emphasisOf(game.is_finished, game.home_score, game.away_score)}
      />
      <GameSide
        name={awayName}
        logoUrl={game.away_team?.logo_url}
        score={shown ? score.awayScore : null}
        emphasis={emphasisOf(game.is_finished, game.away_score, game.home_score)}
      />
    </TouchableOpacity>
  );
};

export const GamesPanel = ({ phaseTitle, dateKeys, selectedDate, onSelectDate, games, onPressGame, apiBaseUrl }: Props) => {
  const index = selectedDate ? dateKeys.indexOf(selectedDate) : -1;
  const previous = index > 0 ? dateKeys[index - 1] : null;
  const next = index >= 0 && index < dateKeys.length - 1 ? dateKeys[index + 1] : null;

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>Jogos</Text>
        <Text numberOfLines={1} style={styles.phase}>{phaseTitle}</Text>
      </View>
      <View style={styles.panel}>
        {selectedDate ? (
          <View style={styles.dateSelector}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Data anterior"
              disabled={!previous}
              onPress={() => previous && onSelectDate(previous)}
              style={styles.dateButton}
            >
              <Ionicons name="chevron-back" size={16} color={previous ? theme.colors.ink : theme.colors.inactive} />
            </TouchableOpacity>
            <Text style={styles.date}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Próxima data"
              disabled={!next}
              onPress={() => next && onSelectDate(next)}
              style={styles.dateButton}
            >
              <Ionicons name="chevron-forward" size={16} color={next ? theme.colors.ink : theme.colors.inactive} />
            </TouchableOpacity>
          </View>
        ) : null}
        {games.length ? (
          games.map((game) => <GameRow key={game.id} game={game} apiBaseUrl={apiBaseUrl} onPress={() => onPressGame(game.id)} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sem partidas para esta data</Text>
            <Text style={styles.emptyText}>Navegue pelas datas para consultar os próximos jogos.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  phase: { flexShrink: 1, color: theme.colors.subtleText, fontSize: 12 },
  panel: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  dateSelector: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.tint,
  },
  dateButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  date: { color: theme.colors.ink, fontSize: 14, fontWeight: '800' },
  game: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  time: { color: theme.colors.subtleText, fontSize: 12 },
  venue: { flexShrink: 1, color: theme.colors.subtleText, fontSize: 12, textTransform: 'uppercase' },
  side: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sideName: { flex: 1, fontSize: 14 },
  sideScore: { minWidth: 24, fontSize: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  winner: { color: theme.colors.olive, fontWeight: '800' },
  loser: { color: theme.colors.subtleText },
  neutral: { color: theme.colors.ink },
  empty: { padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.xs },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '800' },
  emptyText: { color: theme.colors.subtleText, fontSize: 12, textAlign: 'center' },
});
