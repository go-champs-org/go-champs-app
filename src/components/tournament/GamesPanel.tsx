import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Game } from '../../models/GameModel';
import { theme } from '../../theme/theme';

type Props = {
  phaseTitle: string;
  dateKeys: string[];
  selectedDate: string | null;
  onSelectDate: (value: string) => void;
  games: Game[];
  onPressGame: (gameId: string) => void;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

type Tone = 'winner' | 'loser' | 'pending';

const TeamResult = ({ name, score, tone }: { name: string; score: number | null; tone: Tone }) => (
  <View style={styles.teamResult}>
    <Text numberOfLines={1} style={[styles.teamName, styles[tone]]}>{name}</Text>
    <Text style={[styles.score, tone === 'winner' ? styles.winnerScore : styles[tone]]}>{score ?? '-'}</Text>
  </View>
);

const toneOf = (finished: boolean, own: number, other: number): Tone => {
  if (!finished) return 'pending';
  return own > other ? 'winner' : 'loser';
};

const GameRow = ({ game, onPress }: { game: Game; onPress: () => void }) => {
  const homeName = game.home_team?.name || game.home_placeholder || 'A definir';
  const awayName = game.away_team?.name || game.away_placeholder || 'A definir';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir jogo ${homeName} versus ${awayName}`}
      onPress={onPress}
      style={styles.game}
    >
      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(game.datetime)}</Text>
        <Text numberOfLines={1} style={styles.venue}>{game.location || 'Local a definir'}</Text>
      </View>
      <TeamResult name={homeName} score={game.home_score} tone={toneOf(game.is_finished, game.home_score, game.away_score)} />
      <TeamResult name={awayName} score={game.away_score} tone={toneOf(game.is_finished, game.away_score, game.home_score)} />
    </TouchableOpacity>
  );
};

export const GamesPanel = ({ phaseTitle, dateKeys, selectedDate, onSelectDate, games, onPressGame }: Props) => {
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
          games.map((game) => <GameRow key={game.id} game={game} onPress={() => onPressGame(game.id)} />)
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
    padding: theme.spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  time: { color: theme.colors.olive, fontSize: 11, fontWeight: '800' },
  venue: { flexShrink: 1, color: theme.colors.subtleText, fontSize: 11 },
  teamResult: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamName: { flex: 1, fontSize: 14 },
  score: { fontSize: 16 },
  winner: { color: theme.colors.ink, fontWeight: '800' },
  winnerScore: { color: theme.colors.lime, fontWeight: '900' },
  loser: { color: theme.colors.subtleText, fontWeight: '500' },
  pending: { color: theme.colors.ink, fontWeight: '600' },
  empty: { padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.xs },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '800' },
  emptyText: { color: theme.colors.subtleText, fontSize: 12, textAlign: 'center' },
});
