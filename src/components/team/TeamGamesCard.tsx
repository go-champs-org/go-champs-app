import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Game } from '../../models/GameModel';
import { formatGameTime } from '../../domain/usecases/shared/gameDateTime';
import { isLiveGame, showsScore } from '../../domain/usecases/shared/liveScore';
import { GameDay, gameWinner, SideEmphasis, sideEmphasis } from '../../domain/usecases/shared/teamPresentation';
import { useLiveScore } from '../../viewmodels/LiveScoreViewModel';
import { LiveBadge } from '../competition/LiveBadge';
import { TeamBadge } from '../competition/TeamBadge';
import { makeStyles } from '../../theme/theme';

type Props = {
  days: GameDay[];
  onPressGame: (gameId: string) => void;
  apiBaseUrl?: string;
};

const UNDECIDED = 'A definir';

type SideProps = { name: string; logoUrl?: string | null; emphasis: SideEmphasis; align: 'left' | 'right' };

// The logo faces the score in the middle: the home side reads right to left.
const GameSide = ({ name, logoUrl, emphasis, align }: SideProps) => {
  const styles = useStyles();
  return (
    <View style={[styles.side, align === 'right' && styles.sideRight]}>
      {logoUrl ? (
        <View style={emphasis === 'loser' && styles.loserLogo}>
          <TeamBadge logoUrl={logoUrl} name={name} size={28} />
        </View>
      ) : null}
      <Text numberOfLines={2} style={[styles.sideName, align === 'right' && styles.sideNameRight, styles[emphasis]]}>{name}</Text>
    </View>
  );
};

type RowProps = { game: Game; apiBaseUrl?: string; onPress: () => void; first: boolean };

// One game as the public team page lists it: home, the score over the kickoff
// time (and the live badge), away. A live game keeps its score running from
// the scoreboard, like the Jogos panel.
const GameRow = ({ game, apiBaseUrl, onPress, first }: RowProps) => {
  const styles = useStyles();
  const live = isLiveGame(game.live_state);
  const score = useLiveScore(game.id, live, { homeScore: game.home_score, awayScore: game.away_score }, apiBaseUrl);
  const winner = gameWinner(game);
  const home = sideEmphasis(winner, 'home');
  const away = sideEmphasis(winner, 'away');
  const homeName = game.home_team?.name || game.home_placeholder || UNDECIDED;
  const awayName = game.away_team?.name || game.away_placeholder || UNDECIDED;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir jogo ${homeName} versus ${awayName}`}
      onPress={onPress}
      style={[styles.row, !first && styles.rowDivider]}
      testID="team-game-row"
    >
      <GameSide name={homeName} logoUrl={game.home_team?.logo_url} emphasis={home} align="right" />
      <View style={styles.center}>
        {showsScore(game) ? (
          <View style={styles.score}>
            <Text style={[styles.scoreValue, styles[home]]}>{score.homeScore}</Text>
            <Text style={styles.scoreSeparator}>x</Text>
            <Text style={[styles.scoreValue, styles[away]]}>{score.awayScore}</Text>
          </View>
        ) : null}
        <Text style={styles.time}>{formatGameTime(game.datetime)}</Text>
        {live ? <LiveBadge /> : null}
      </View>
      <GameSide name={awayName} logoUrl={game.away_team?.logo_url} emphasis={away} align="left" />
    </TouchableOpacity>
  );
};

// The team's games by day, newest first; a day's games share one bordered
// block, the way the public team page stacks them.
export const TeamGamesCard = ({ days, onPressGame, apiBaseUrl }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID="team-games">
      {days.map((day) => (
        <View key={day.key || 'undated'} style={styles.day}>
          {day.label ? <Text style={styles.dayLabel}>{day.label}</Text> : null}
          <View style={styles.dayGames}>
            {day.games.map((game, index) => (
              <GameRow key={game.id} game={game} apiBaseUrl={apiBaseUrl} first={index === 0} onPress={() => onPressGame(game.id)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  day: { gap: theme.spacing.sm },
  dayLabel: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayGames: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  side: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sideRight: { flexDirection: 'row-reverse' },
  sideName: { flexShrink: 1, fontSize: theme.typography.bodySmall },
  sideNameRight: { textAlign: 'right' },
  loserLogo: { opacity: 0.6 },
  center: { alignItems: 'center', gap: 2 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreValue: { fontSize: theme.typography.bodySmall, fontVariant: ['tabular-nums'] },
  scoreSeparator: { color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  time: { color: theme.colors.mutedText, fontSize: theme.typography.caption },
  winner: { color: theme.colors.textPrimary, fontWeight: '800' },
  loser: { color: theme.colors.mutedText, fontWeight: '500' },
  neutral: { color: theme.colors.textPrimary, fontWeight: '500' },
}));
