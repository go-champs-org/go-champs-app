import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StandingsGroup } from '../../domain/usecases/GetPhaseOverviewUseCase';
import { StandingsColumn } from '../../domain/usecases/shared/standingsPresentation';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';
import { EmptyState } from '../feedback/EmptyState';

type Props = {
  columns: StandingsColumn[];
  groups: StandingsGroup[];
};

// Both halves of the table share these heights so a row lines up across the
// fixed team column and the stats that scroll behind it.
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 48;
const TEAM_COLUMN_WIDTH = 132;

const isNegative = (value: string) => /^-\d/.test(value.trim());

// Wide enough for the stat's full title on one line, within reason. Columns
// stretch to fill the card when they don't need to scroll.
const columnWidth = (title: string) => Math.min(120, Math.max(52, title.length * 7 + 20));

const StandingsTable = ({ group, columns }: { group: StandingsGroup; columns: StandingsColumn[] }) => (
  <View style={styles.card}>
    {group.title ? (
      <View style={styles.groupHeader}>
        <Text numberOfLines={1} style={styles.groupTitle}>{group.title}</Text>
      </View>
    ) : null}
    <View style={styles.table}>
      <View style={styles.fixed}>
        <View style={[styles.headerRow, styles.teamHeader]}>
          <Text style={[styles.headerText, styles.rankCell]}>#</Text>
          <Text style={styles.headerText}>TIME</Text>
        </View>
        {group.rows.map((row, index) => (
          <View key={row.id} style={[styles.bodyRow, styles.teamCell, index > 0 && styles.rowDivider]}>
            <Text style={[styles.rank, styles.rankCell]}>{index + 1}</Text>
            <TeamBadge logoUrl={row.team.logo_url} name={row.team.name || row.shortName} size={24} />
            <Text accessibilityLabel={row.team.name || row.shortName} numberOfLines={1} style={styles.team}>
              {row.shortName}
            </Text>
          </View>
        ))}
        <View pointerEvents="none" style={styles.fixedEdge} />
      </View>
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stats}>
          <View style={styles.headerRow}>
            {columns.map((column) => (
              <Text key={column.id} numberOfLines={1} style={[styles.headerText, styles.statCell, { minWidth: columnWidth(column.title) }]}>
                {column.title}
              </Text>
            ))}
          </View>
          {group.rows.map((row, index) => (
            <View key={row.id} style={[styles.bodyRow, index > 0 && styles.rowDivider]}>
              {columns.map((column) => {
                const value = row.values[column.id];
                return (
                  <Text
                    key={column.id}
                    style={[styles.statValue, styles.statCell, { minWidth: columnWidth(column.title) }, isNegative(value) && styles.statNegative]}
                  >
                    {value}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  </View>
);

export const StandingsSection = ({ columns, groups }: Props) => {
  if (groups.length === 0) {
    return <EmptyState icon="list-outline" title="Classificação indisponível" description="Os dados desta fase ainda não foram publicados." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Tabela de classificação</Text>
        {groups.length > 1 ? <Text style={styles.count}>{groups.length} grupos</Text> : null}
      </View>
      {groups.map((group) => <StandingsTable key={group.id} group={group} columns={columns} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  count: { color: theme.colors.subtleText, fontSize: 12 },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  groupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.subtleBorder,
  },
  groupTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  table: { flexDirection: 'row' },
  // The team column sits above the scrolling stats, with an edge that shows
  // where they slide under it.
  fixed: {
    width: TEAM_COLUMN_WIDTH,
    zIndex: 1,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  // One line down the whole column, header band included, so the edge the
  // stats slide under reads the same on green and on white.
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
  teamHeader: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  headerText: { color: theme.colors.onOliveSoft, fontSize: 11, fontWeight: '800' },
  bodyRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.subtleBorder },
  teamCell: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  rankCell: { width: 16, textAlign: 'center' },
  rank: { color: theme.colors.subtleText, fontSize: 12, fontWeight: '700' },
  team: { flex: 1, color: theme.colors.ink, fontSize: 13, fontWeight: '800' },
  statCell: { flexGrow: 1, flexBasis: 0, textAlign: 'center' },
  statValue: { color: theme.colors.ink, fontSize: 14 },
  statNegative: { color: theme.colors.danger, fontWeight: '900' },
});
