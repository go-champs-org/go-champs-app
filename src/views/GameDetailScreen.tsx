import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { makeStyles, useTheme } from '../theme/theme';
import { RefreshNotice, themedRefreshControl } from '../components/feedback/RefreshFeedback';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { LiveBadge } from '../components/competition/LiveBadge';
import { PlayerAvatar } from '../components/competition/PlayerAvatar';
import { TeamBadge } from '../components/competition/TeamBadge';
import { YouTubePlayer } from '../components/video/YouTubePlayer';
import { youtubeVideoId } from '../domain/usecases/shared/youtube';
import { useGameDetailViewModel } from '../viewmodels/GameDetailViewModel';
import {
  BoxScoreSort,
  boxScoreCellValue,
  didNotPlay,
  isStarter,
  nextBoxScoreSort,
  sortedBoxScoreTeam,
} from '../domain/usecases/shared/boxScore';
import { formatGameDateTime } from '../domain/usecases/shared/gameDateTime';
import { LiveScore } from '../domain/usecases/shared/liveScore';
import { BoxScoreColumn, BoxScoreRow, BoxScoreTeam, GameAsset, GameBoxScore } from '../models/GameDetail';

type Props = { route: RouteProp<RootStackParamList, 'GameDetailScreen'> };

const UNDECIDED = 'A definir';

const assetLabel = (type: string) => {
  if (type === 'fiba-scoresheet') return 'Súmula FIBA';
  if (type === 'fiba-boxscore') return 'Boxscore FIBA';
  return type;
};

const GameDetailScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { gameId, apiBaseUrl } = route.params;
  const { loading, error, game, boxScore, isLive, score, periodLabel, retry, refreshing, refreshError, refresh } = useGameDetailViewModel(
    gameId,
    apiBaseUrl
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.screen}>
        <ContentShell style={styles.content}>
          <EmptyState
            icon="alert-circle-outline"
            title="Jogo indisponível"
            description={error || 'Não encontramos os dados desta partida.'}
          />
          <TouchableOpacity accessibilityRole="button" onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </ContentShell>
      </View>
    );
  }

  const videoId = youtubeVideoId(game.youtube_code);

  const tournamentName = game.phase?.tournament?.name || 'Campeonato';
  const tournamentId = game.phase?.tournament?.id;
  // A side still to be decided, or a game whose tournament is unknown, has no
  // team page to open.
  const openTeam = (teamId: string | undefined) =>
    tournamentId && teamId ? () => navigation.navigate('TeamScreen', { tournamentId, teamId, apiBaseUrl }) : undefined;
  // The box score links each athlete to their page in the game's tournament.
  const openAthlete = tournamentId
    ? (playerId: string) => navigation.navigate('AthleteScreen', { tournamentId, playerId, apiBaseUrl })
    : undefined;
  const venue = [game.location, game.city].filter(Boolean).join(' — ') || 'Local a definir';
  const homeName = game.home_team?.name || game.home_placeholder || UNDECIDED;
  const awayName = game.away_team?.name || game.away_placeholder || UNDECIDED;
  // Only http(s) is safe to hand to the system browser.
  const assets = (game.assets || []).filter((asset) => /^https?:\/\//.test(asset.url));

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={themedRefreshControl(theme, refreshing, refresh)}
        >
          <RefreshNotice message={refreshError} style={styles.refreshNotice} />
          <Text style={styles.tournament}>{tournamentName}</Text>

          <View style={styles.scoreCard}>
            <View style={styles.metaRow}>
              <Text style={styles.date}>{formatGameDateTime(game.datetime)}</Text>
              <Text style={styles.venue} numberOfLines={1}>
                {venue}
              </Text>
            </View>

            {isLive ? (
              <View style={styles.liveRow}>
                <LiveBadge />
                {/* Keeps its height before the first scoreboard response so
                    the score under it does not jump. */}
                <Text style={styles.period}>{periodLabel ?? ''}</Text>
              </View>
            ) : null}

            <View style={styles.scoreboard}>
              <TeamIdentity name={homeName} logoUrl={game.home_team?.logo_url} onPress={openTeam(game.home_team?.id)} />
              <Score score={score} homeName={homeName} awayName={awayName} />
              <TeamIdentity name={awayName} logoUrl={game.away_team?.logo_url} onPress={openTeam(game.away_team?.id)} />
            </View>

            {game.info ? <Text style={styles.info}>{game.info}</Text> : null}
          </View>

          {/* The game's PDFs share one full-width line under the score. */}
          {assets.length ? (
            <View style={styles.assetRow}>
              {assets.map((asset: GameAsset) => (
                <TouchableOpacity
                  key={asset.id || asset.url}
                  accessibilityRole="button"
                  accessibilityLabel={assetLabel(asset.type)}
                  onPress={() => void Linking.openURL(asset.url)}
                  style={styles.assetButton}
                >
                  <Ionicons name="document-text-outline" size={16} color={theme.colors.success} />
                  <Text style={styles.assetText}>{assetLabel(asset.type)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {videoId ? (
            <View style={styles.video}>
              <YouTubePlayer videoId={videoId} />
            </View>
          ) : null}

          {boxScore ? <BoxScoreSection boxScore={boxScore} onPressAthlete={openAthlete} /> : null}
        </ScrollView>
      </ContentShell>
    </View>
  );
};

type TeamIdentityProps = { name: string; logoUrl?: string | null; onPress?: () => void };

// Logo and name open the team's page when there is one to open.
const TeamIdentity = ({ name, logoUrl, onPress }: TeamIdentityProps) => {
  const styles = useStyles();
  const content = (
    <>
      <TeamBadge logoUrl={logoUrl} name={name} size={56} />
      <Text style={styles.teamName} numberOfLines={2}>
        {name}
      </Text>
    </>
  );
  if (!onPress) return <View style={styles.teamBlock}>{content}</View>;
  return (
    <TouchableOpacity accessibilityRole="link" accessibilityLabel={`Abrir time ${name}`} onPress={onPress} style={styles.teamBlock}>
      {content}
    </TouchableOpacity>
  );
};

// The digits alone say nothing out loud: each side carries the team it
// belongs to, so a live update reads as a sentence.
const Score = ({ score, homeName, awayName }: { score: LiveScore | null; homeName: string; awayName: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.scoreRow} accessibilityLiveRegion="polite">
      {score ? (
        <Text accessibilityLabel={`${homeName}: ${score.homeScore}`} style={styles.score}>
          {score.homeScore}
        </Text>
      ) : null}
      <Text style={styles.scoreSeparator}>x</Text>
      {score ? (
        <Text accessibilityLabel={`${awayName}: ${score.awayScore}`} style={styles.score}>
          {score.awayScore}
        </Text>
      ) : null}
    </View>
  );
};

const STARTER_LABEL = 'Titular';

// The starter dot is read off the table like a column, so the glossary
// explains it ahead of the columns — only once a starter shows.
const glossaryEntries = (boxScore: GameBoxScore) => {
  const hasStarter = [...boxScore.home.rows, ...boxScore.away.rows].some((row) => isStarter(row.stats));
  const columns = boxScore.columns.map((column) => ({ key: column.slug, label: column.label, description: column.description }));
  return hasStarter ? [{ key: 'starter', label: '●', description: STARTER_LABEL }, ...columns] : columns;
};

type OpenAthlete = ((playerId: string) => void) | undefined;

const BoxScoreSection = ({ boxScore, onPressAthlete }: { boxScore: GameBoxScore; onPressAthlete: OpenAthlete }) => {
  const theme = useTheme();
  const styles = useStyles();
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  // Null until a header is tapped: the box score opens in its ranked order.
  // One sort for both sides, so a tap reads the same column across the game.
  const [sort, setSort] = useState<BoxScoreSort | null>(null);
  const onSort = (slug: string) => setSort((current) => nextBoxScoreSort(current, slug));

  return (
    <View style={styles.boxScore}>
      <View style={styles.boxHeader}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Glossário"
          accessibilityState={{ expanded: glossaryOpen }}
          onPress={() => setGlossaryOpen((value) => !value)}
          style={styles.glossaryButton}
        >
          <Text style={styles.glossaryButtonText}>Glossário</Text>
          <Ionicons name={glossaryOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.success} />
        </TouchableOpacity>
      </View>

      {glossaryOpen ? (
        <View style={styles.glossary}>
          {glossaryEntries(boxScore).map((item) => (
            <Text key={item.key} style={styles.glossaryItem}>
              <Text style={styles.glossaryLabel}>{item.label}</Text> — {item.description}
            </Text>
          ))}
        </View>
      ) : null}

      {[boxScore.home, boxScore.away].map((team) => (
        <BoxScoreTable
          key={team.teamId || team.teamName}
          team={sortedBoxScoreTeam(team, sort)}
          columns={boxScore.columns}
          sort={sort}
          onSort={onSort}
          onPressAthlete={onPressAthlete}
        />
      ))}
    </View>
  );
};

const NAME_WIDTH = 168;
const cellWidth = (column: BoxScoreColumn) => (column.attemptedSlug ? 64 : 52);

type TableProps = {
  team: BoxScoreTeam;
  columns: BoxScoreColumn[];
  sort: BoxScoreSort | null;
  onSort: (slug: string) => void;
  onPressAthlete: OpenAthlete;
};

// The name column stays pinned while the statistics scroll under it.
const BoxScoreTable = ({ team, columns, sort, onSort, onPressAthlete }: TableProps) => {
  const styles = useStyles();
  // Logs saved before the API stored the number carry none, and a column of
  // empty slots would only cost width.
  const showNumber = team.rows.some((row) => row.number);
  const statsWidth = columns.reduce((width, column) => width + cellWidth(column), 0);

  return (
    <View style={styles.tableBlock} testID="box-score-team">
      <View style={styles.teamHeader}>
        <TeamBadge logoUrl={team.logoUrl} name={team.teamName} size={28} />
        <Text style={styles.teamHeaderName}>{team.teamName}</Text>
      </View>
      <View style={styles.table}>
        <View style={[styles.nameColumn, { width: NAME_WIDTH }]}>
          <View style={[styles.cellRow, styles.headerBand]}>
            <Text style={styles.bandLabel}>ATLETA</Text>
          </View>
          {team.rows.map((row, index) => (
            <PlayerNameCell key={row.playerId || `${row.name}-${index}`} row={row} showNumber={showNumber} onPressAthlete={onPressAthlete} />
          ))}
          <View style={[styles.cellRow, styles.totalsBand]}>
            <Text style={styles.totalsLabel}>Totais</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={[styles.cellRow, styles.headerBand]}>
              {columns.map((column) => (
                <StatHeader key={column.slug} column={column} sort={sort} onSort={onSort} />
              ))}
            </View>
            {team.rows.map((row, index) => (
              <View key={row.playerId || `${row.name}-${index}`} style={[styles.cellRow, styles.bodyRow]}>
                {didNotPlay(row.stats) ? (
                  <Text style={[styles.didNotPlay, { width: statsWidth }]}>Não jogou</Text>
                ) : (
                  columns.map((column) => (
                    <Text key={column.slug} style={[styles.statCell, { width: cellWidth(column) }]}>
                      {boxScoreCellValue(column, row.stats)}
                    </Text>
                  ))
                )}
              </View>
            ))}
            <View style={[styles.cellRow, styles.totalsBand]}>
              {columns.map((column) => (
                <Text key={column.slug} style={[styles.statCell, styles.totalsCell, { width: cellWidth(column) }]}>
                  {boxScoreCellValue(column, team.totals)}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// A line with no athlete id, or a game whose tournament is unknown, has no
// athlete page to open.
const PlayerNameCell = ({ row, showNumber, onPressAthlete }: { row: BoxScoreRow; showNumber: boolean; onPressAthlete: OpenAthlete }) => {
  const styles = useStyles();
  const content = (
    <>
      {showNumber ? <Text style={styles.playerNumber}>{row.number ?? ''}</Text> : null}
      <PlayerAvatar photoUrl={row.photoUrl} name={row.name} size={28} />
      <Text style={styles.playerName} numberOfLines={1}>
        {row.name}
      </Text>
      {isStarter(row.stats) ? <View accessibilityLabel={STARTER_LABEL} style={styles.starterDot} /> : null}
    </>
  );
  if (!onPressAthlete || !row.playerId) {
    return <View style={[styles.cellRow, styles.bodyRow, styles.nameCell]}>{content}</View>;
  }
  const { playerId } = row;
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`Abrir atleta ${row.name}`}
      onPress={() => onPressAthlete(playerId)}
      style={[styles.cellRow, styles.bodyRow, styles.nameCell]}
      testID="box-score-athlete"
    >
      {content}
    </TouchableOpacity>
  );
};

const StatHeader = ({
  column,
  sort,
  onSort,
}: {
  column: BoxScoreColumn;
  sort: BoxScoreSort | null;
  onSort: (slug: string) => void;
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const direction = sort?.slug === column.slug ? sort.direction : null;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${column.description}`}
      onPress={() => onSort(column.slug)}
      style={[styles.statHeader, { width: cellWidth(column) }]}
    >
      <Text style={styles.statHeaderLabel}>{column.label}</Text>
      {direction ? (
        <Ionicons name={direction === 'desc' ? 'caret-down' : 'caret-up'} size={10} color={theme.colors.ink} />
      ) : null}
    </TouchableOpacity>
  );
};

const ROW_HEIGHT = 44;

const useStyles = makeStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  refreshNotice: { marginBottom: theme.spacing.md },
  tournament: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  assetRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  assetButton: {
    flex: 1,
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  assetText: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '800' },
  scoreCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  date: { flexShrink: 0, color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  venue: {
    flexShrink: 1,
    textAlign: 'right',
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
  },
  liveRow: { marginTop: theme.spacing.md, alignItems: 'center', gap: theme.spacing.xs },
  period: {
    minHeight: 16,
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  scoreboard: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: theme.spacing.sm },
  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  score: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreSeparator: { color: theme.colors.mutedText, fontSize: theme.typography.title },
  info: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.mutedText,
    fontSize: theme.typography.bodySmall,
  },
  video: {
    marginTop: theme.spacing.md,
  },
  // The tables run edge to edge of the card, split by a line only.
  boxScore: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  boxHeader: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '700',
  },
  glossaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },
  glossaryButtonText: {
    color: theme.colors.success,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  glossary: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    gap: 4,
  },
  glossaryItem: { color: theme.colors.mutedText, fontSize: theme.typography.caption, lineHeight: 18 },
  glossaryLabel: { color: theme.colors.textPrimary, fontWeight: '900' },
  tableBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  teamHeaderName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.titleSmall,
    fontWeight: '800',
  },
  table: { flexDirection: 'row' },
  nameColumn: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.divider,
    backgroundColor: theme.colors.card,
  },
  cellRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  headerBand: { backgroundColor: theme.colors.accentSoft },
  totalsBand: { backgroundColor: theme.colors.surfaceStrong },
  bodyRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  bandLabel: {
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalsLabel: {
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '800',
  },
  nameCell: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.xs },
  playerNumber: {
    width: 18,
    textAlign: 'right',
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    fontVariant: ['tabular-nums'],
  },
  playerName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '700',
  },
  starterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  statHeader: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
  },
  statHeaderLabel: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statCell: {
    paddingHorizontal: theme.spacing.xs,
    textAlign: 'right',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontVariant: ['tabular-nums'],
  },
  totalsCell: { fontWeight: '800' },
  didNotPlay: {
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
  },
  retry: {
    marginHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: theme.colors.onAccent, fontWeight: '900' },
}));

export default GameDetailScreen;
