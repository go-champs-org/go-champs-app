import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatStatValue, StatColumn, TournamentStatsRow } from '../../domain/usecases/shared/tournamentStats';
import { theme } from '../../theme/theme';
import { PlayerAvatar } from '../competition/PlayerAvatar';
import { TeamBadge } from '../competition/TeamBadge';


// Both halves share these heights so a row lines up across the fixed
// position-and-athlete column and the stats that scroll behind it, the same
// pattern as the standings table.
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 52;
const ATHLETE_COLUMN_WIDTH = 180;
const TEAM_COLUMN_WIDTH = 48;
const STAT_COLUMN_WIDTH = 56;

// Each header ranks its column, best first, like the public site's table.
const StatHeader = ({ column, selected, onPress }: { column: StatColumn; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`Ordenar por ${column.description}`}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.statHeader, selected && styles.selectedColumn]}
  >
    <Text numberOfLines={1} style={[styles.headerText, selected && styles.headerTextSelected]}>{column.label}</Text>
    {selected ? <Ionicons name="arrow-down" size={11} color={theme.colors.ink} /> : null}
  </TouchableOpacity>
);

// The header sticks to the top while the screen scrolls, so it lives apart
// from the rows. Scrolling the rows sideways scrolls the stat headers with
// them; a real scroll, not a transform, so a tapped header is the one drawn
// under the finger.
export const useStatsTableScroll = () => {
  const headerRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  }, []);
  return { headerRef, onScroll };
};


type HeaderProps = {
  columns: StatColumn[];
  statKey: string | null;
  scrollRef: ReturnType<typeof useStatsTableScroll>['headerRef'];
  onSelectStat: (statKey: string) => void;
};

export const StatsTableHeader = ({ columns, statKey, scrollRef, onSelectStat }: HeaderProps) => (
  <View style={[styles.table, styles.headerRow]} testID="tournament-stats-header">
    <View style={[styles.fixed, styles.headerRow, styles.athleteHeader]}>
      <Text numberOfLines={1} style={[styles.headerText, styles.rankCell]}>Pos.</Text>
      <Text style={styles.headerText}>Atleta</Text>
      <View pointerEvents="none" style={styles.fixedEdge} />
    </View>
    <ScrollView ref={scrollRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, styles.teamCell]}>Time</Text>
        {columns.map((column) => (
          <StatHeader key={column.key} column={column} selected={column.key === statKey} onPress={() => onSelectStat(column.key)} />
        ))}
      </View>
    </ScrollView>
  </View>
);

type Props = {
  columns: StatColumn[];
  rows: TournamentStatsRow[];
  statKey: string | null;
  loading: boolean;
  emptyLabel: string;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  // Opens the athlete's page, as the public stats table links each name.
  onPressAthlete: (playerId: string) => void;
};

export const StatsTable = ({ columns, rows, statKey, loading, emptyLabel, onScroll, onPressAthlete }: Props) => (
  <View style={styles.container} testID="tournament-stats-table">
    <View style={styles.table}>
      <View style={styles.fixed}>
        {rows.map((row, index) => (
          <TouchableOpacity
            key={row.playerId}
            accessibilityRole="link"
            accessibilityLabel={`Abrir atleta ${row.name}`}
            onPress={() => onPressAthlete(row.playerId)}
            style={[styles.bodyRow, styles.athleteCell, index > 0 && styles.rowDivider]}
            testID="tournament-stats-athlete"
          >
            <Text style={[styles.rank, styles.rankCell]}>{index + 1}</Text>
            <PlayerAvatar photoUrl={row.photoUrl} name={row.name} size={28} />
            <Text numberOfLines={1} style={styles.athlete}>{row.name}</Text>
          </TouchableOpacity>
        ))}
        <View pointerEvents="none" style={styles.fixedEdge} />
      </View>
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stats}>
          {rows.map((row, index) => (
            <View key={row.playerId} style={[styles.bodyRow, index > 0 && styles.rowDivider]}>
              <View accessibilityLabel={row.team?.name || 'Sem time'} style={[styles.teamCell, styles.team]}>
                {row.team ? <TeamBadge logoUrl={row.team.logoUrl} name={row.team.name} size={24} /> : <Text style={styles.noTeam}>-</Text>}
              </View>
              {columns.map((column) => {
                const selected = column.key === statKey;
                return (
                  <Text key={column.key} style={[styles.statValue, selected && [styles.selectedColumn, styles.statValueSelected]]}>
                    {formatStatValue(column.key, row.stats[column.key])}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
    {rows.length === 0 && !loading ? <Text style={styles.empty}>{emptyLabel}</Text> : null}
    {loading ? (
      <View style={[styles.loading, rows.length === 0 && styles.loadingEmpty]}>
        <ActivityIndicator accessibilityLabel="Carregando estatísticas" color={theme.colors.accent} />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.card },
  table: { flexDirection: 'row' },
  // The athlete column sits above the scrolling stats, with an edge that
  // shows where they slide under it.
  fixed: {
    width: ATHLETE_COLUMN_WIDTH,
    zIndex: 1,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  fixedEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.divider,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  stats: { flexGrow: 1 },
  headerRow: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.oliveSoft,
  },
  athleteHeader: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  headerText: { color: theme.colors.onOliveSoft, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  headerTextSelected: { color: theme.colors.ink, fontWeight: '900' },
  statHeader: {
    width: STAT_COLUMN_WIDTH,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  selectedColumn: { backgroundColor: 'rgba(79, 102, 40, 0.12)' },
  bodyRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.subtleBorder },
  athleteCell: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  rankCell: { width: 30, textAlign: 'center' },
  rank: { color: theme.colors.subtleText, fontSize: 12, fontWeight: '700' },
  athlete: { flex: 1, color: theme.colors.ink, fontSize: 13, fontWeight: '800' },
  teamCell: { width: TEAM_COLUMN_WIDTH, textAlign: 'center' },
  team: { alignItems: 'center', justifyContent: 'center' },
  noTeam: { color: theme.colors.subtleText, fontSize: 12, fontWeight: '700' },
  statValue: {
    width: STAT_COLUMN_WIDTH,
    height: ROW_HEIGHT,
    lineHeight: ROW_HEIGHT,
    color: theme.colors.ink,
    fontSize: 13,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  statValueSelected: { color: theme.colors.olive, fontWeight: '900' },
  empty: {
    padding: theme.spacing.md,
    color: theme.colors.subtleText,
    fontSize: 13,
  },
  // Over the rows already on screen while the next ranking loads.
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  loadingEmpty: { position: 'relative', top: 0, height: ROW_HEIGHT * 2 },
});
