import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContentShell } from '../layout/ContentShell';
import { TeamBadge } from '../competition/TeamBadge';
import { SelectField, SelectOption } from '../forms/SelectField';
import { makeStyles, useTheme } from '../../theme/theme';
import { AthleteRecentGame, AthleteTeamGame } from '../../domain/repositories/AthleteProfileRepository';
import {
  athleteSides,
  dateTile,
  kickoffTime,
  longDate,
  MyGamesTournament,
  MyGamesView,
  resultHeading,
  resultLabel,
  resultMatchup,
  resultTone,
  ResultTone,
  statLine,
  statusLabel,
  TeamMark,
  upcomingMeta,
  venueLabel,
} from '../../domain/usecases/shared/myGames';

const VIEWS: { view: MyGamesView; label: string }[] = [
  { view: 'all', label: 'Todos os jogos' },
  { view: 'upcoming', label: 'Próximos' },
];

type HeaderProps = {
  view: MyGamesView;
  tournamentId: string | null;
  tournaments: MyGamesTournament[];
  onSelectView: (view: MyGamesView) => void;
  onSelectTournament: (id: string | null) => void;
};

// The dark band under the header: the title and the filters, which only narrow the games already loaded.
export const MyGamesHeader = ({
  view,
  tournamentId,
  tournaments,
  onSelectView,
  onSelectTournament,
}: HeaderProps) => {
  const styles = useStyles();
  const options: SelectOption[] = [
    { id: null, label: 'Todos os campeonatos' },
    ...tournaments.map((tournament) => ({ id: tournament.id, label: tournament.name })),
  ];
  return (
    <View style={styles.header}>
      <ContentShell style={styles.headerContent}>
        <Text accessibilityRole="header" style={styles.title}>
          Meus jogos
        </Text>
        <View accessibilityRole="tablist" style={styles.pills}>
          {VIEWS.map((option) => {
            const selected = option.view === view;
            return (
              <TouchableOpacity
                key={option.view}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => onSelectView(option.view)}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <SelectField
          label="Campeonato"
          tone="onDark"
          options={options}
          value={tournamentId}
          onChange={onSelectTournament}
        />
      </ContentShell>
    </View>
  );
};

export const MyGamesSectionHeading = ({ title, detail }: { title: string; detail?: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
};

const DateTile = ({ iso, large = false }: { iso: string | null; large?: boolean }) => {
  const styles = useStyles();
  const tile = dateTile(iso);
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileDay, large && styles.tileDayLarge]}>{tile.day}</Text>
      <Text style={styles.tileMonth}>{tile.month}</Text>
    </View>
  );
};

// A team's logo (or initials) beside its tri code; the card's own label reads
// the full names.
const TeamChip = ({
  mark,
  size,
  textStyle,
}: {
  mark: TeamMark;
  size: number;
  textStyle: object;
}) => {
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <TeamBadge logoUrl={mark.logoUrl} name={mark.name} size={size} />
      <Text numberOfLines={1} style={[styles.chipText, textStyle]}>
        {mark.code}
      </Text>
    </View>
  );
};

type GameProps = { game: AthleteTeamGame; onOpen: () => void };

export const NextGameCard = ({ game, onOpen }: GameProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const sides = athleteSides(game, game.athlete_team_id);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir próximo jogo ${sides.team} contra ${sides.opponent}`}
      onPress={onOpen}
      style={styles.nextCard}
      testID="next-game"
    >
      <View style={styles.nextTop}>
        <Text numberOfLines={1} style={styles.nextTournament}>
          {game.tournament?.name.toUpperCase()}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel(game)}</Text>
        </View>
      </View>
      <View style={styles.nextWhen}>
        <DateTile iso={game.datetime} large />
        <View style={styles.nextWhenText}>
          <Text style={styles.nextDate}>{longDate(game.datetime)}</Text>
          <Text style={styles.nextTime}>{kickoffTime(game.datetime)}</Text>
        </View>
      </View>
      <View style={styles.nextMatchup}>
        <TeamChip mark={sides.teamMark} size={40} textStyle={styles.nextTeam} />
        <Text style={styles.nextVersus}>vs</Text>
        <TeamChip mark={sides.opponentMark} size={40} textStyle={styles.nextOpponent} />
      </View>
      <View style={styles.venue}>
        <Ionicons name="location-outline" size={17} color={theme.colors.onDark} />
        <Text style={styles.venueText}>{venueLabel(game)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const UpcomingGameCard = ({ game, onOpen }: GameProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const sides = athleteSides(game, game.athlete_team_id);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir jogo ${sides.team} contra ${sides.opponent}`}
      onPress={onOpen}
      style={[styles.card, styles.upcomingCard]}
    >
      <DateTile iso={game.datetime} />
      <View style={styles.upcomingText}>
        <View style={styles.upcomingMatchup}>
          <Text style={styles.upcomingVersus}>vs</Text>
          <TeamChip mark={sides.opponentMark} size={24} textStyle={styles.upcomingTitle} />
        </View>
        <Text style={styles.meta}>{upcomingMeta(game)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
    </TouchableOpacity>
  );
};

export const ResultCard = ({ recent, onOpen }: { recent: AthleteRecentGame; onOpen: () => void }) => {
  const styles = useStyles();
  const TONE_BADGE: Record<ResultTone, object> = { win: styles.badge, loss: styles.badgeLoss, tie: styles.badgeTie };
  const TONE_TEXT: Record<ResultTone, object> = { win: styles.badgeText, loss: styles.badgeTextLoss, tie: styles.badgeTextTie };
  const matchup = resultMatchup(recent);
  const result = resultLabel(recent);
  const tone = resultTone(recent);
  const stats = statLine(recent.stats);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir jogo ${matchup.title}`}
      onPress={onOpen}
      style={[styles.card, styles.resultCard]}
    >
      <View style={styles.resultTop}>
        <Text numberOfLines={1} style={styles.resultHeading}>
          {resultHeading(recent)}
        </Text>
        {result && tone ? (
          <View style={[styles.badge, TONE_BADGE[tone]]} testID={`result-${tone}`}>
            <Text style={[styles.badgeText, TONE_TEXT[tone]]}>{result}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.resultMatchup}>
        <View style={styles.resultTeams}>
          <TeamChip mark={matchup.team} size={28} textStyle={styles.resultTeam} />
          <Text style={styles.resultVersus}>vs</Text>
          <TeamChip mark={matchup.opponent} size={28} textStyle={styles.resultTeam} />
        </View>
        <Text style={styles.resultScore}>{matchup.score}</Text>
      </View>
      {stats ? <Text style={styles.resultStats}>{stats}</Text> : null}
    </TouchableOpacity>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    backgroundColor: theme.colors.primary,
    borderBottomWidth: theme.dark ? 1 : 0,
    borderBottomColor: theme.colors.chromeBorder,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: theme.spacing.sm,
    paddingBottom: 22,
    gap: 14,
  },
  title: {
    color: theme.colors.onDark,
    fontSize: 32,
    fontWeight: '800',
  },
  pills: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.chromeField,
  },
  pillSelected: {
    backgroundColor: theme.colors.accent,
  },
  pillText: {
    color: theme.colors.onDark,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: theme.colors.onAccent,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDetail: {
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
  },
  tile: {
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  tileDay: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  tileDayLarge: {
    fontSize: 28,
  },
  tileMonth: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  nextCard: {
    padding: 18,
    gap: theme.spacing.md,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.chromeBorder,
  },
  nextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  nextTournament: {
    flex: 1,
    color: theme.colors.onDark,
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.oliveSoft,
  },
  badgeText: {
    color: theme.colors.onOliveSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeLoss: {
    backgroundColor: theme.colors.dangerSoft,
  },
  badgeTextLoss: {
    color: theme.colors.onDangerSoft,
  },
  badgeTie: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  badgeTextTie: {
    color: theme.colors.mutedText,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  chipText: {
    flexShrink: 1,
  },
  nextWhen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextWhenText: {
    flex: 1,
    gap: 3,
  },
  nextDate: {
    color: theme.colors.onDark,
    fontSize: 14,
    fontWeight: '500',
  },
  nextTime: {
    color: theme.colors.onDark,
    fontSize: 21,
    fontWeight: '700',
  },
  nextMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextVersus: {
    color: theme.colors.onDark,
    fontSize: 14,
    fontWeight: '600',
  },
  nextTeam: {
    color: theme.colors.onDark,
    fontSize: 26,
    fontWeight: '800',
  },
  nextOpponent: {
    color: theme.colors.lime,
    fontSize: 26,
    fontWeight: '800',
  },
  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    flex: 1,
    color: theme.colors.onDark,
    fontSize: 13,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 14,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  upcomingText: {
    flex: 1,
    gap: 5,
  },
  upcomingMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  upcomingVersus: {
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  resultCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultHeading: {
    flex: 1,
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: '500',
  },
  resultMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultTeams: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultTeam: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  resultVersus: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  resultScore: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  resultStats: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
  },
}));
