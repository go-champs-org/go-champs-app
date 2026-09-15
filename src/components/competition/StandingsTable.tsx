import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EliminationStat } from '../../models/EliminationModel';
import { theme } from '../../theme/theme';
import { TeamBadge } from './TeamBadge';

type Row = {
  team: { name: string; logo_url?: string | null };
  stats: Record<string, string | number>;
};

type Props = {
  rows: Row[];
  stats: EliminationStat[];
};

const shortLabel = (title: string) => title.trim().charAt(0).toUpperCase();

export const StandingsTable = ({ rows, stats }: Props) => (
  <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
    <View style={styles.table}>
      <View style={styles.header}>
        <Text style={[styles.headerText, styles.positionColumn]}>#</Text>
        <Text style={[styles.headerText, styles.teamColumn]}>EQUIPE</Text>
        {stats.map((stat) => <Text key={stat.id} style={[styles.headerText, styles.statColumn]}>{shortLabel(stat.title)}</Text>)}
      </View>
      {rows.map((row, index) => (
        <View key={`${row.team.name}-${index}`} style={[styles.row, index % 2 === 1 && styles.rowAlternate]}>
          <Text style={[styles.cellText, styles.positionColumn]}>{index + 1}</Text>
          <View style={[styles.teamColumn, styles.teamCell]}>
            <TeamBadge logoUrl={row.team.logo_url} name={row.team.name} size={28} />
            <Text numberOfLines={1} style={styles.teamName}>{row.team.name}</Text>
          </View>
          {stats.map((stat) => <Text key={stat.id} style={[styles.cellText, styles.statColumn]}>{row.stats[stat.id] ?? '-'}</Text>)}
        </View>
      ))}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  table: {
    minWidth: 520,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  header: {
    minHeight: 42,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  rowAlternate: { backgroundColor: theme.colors.background },
  headerText: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '900', textAlign: 'center' },
  cellText: { color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '700', textAlign: 'center' },
  positionColumn: { width: 34, flexShrink: 0 },
  teamColumn: { width: 230, flexShrink: 0 },
  statColumn: { width: 58, flexShrink: 0 },
  teamCell: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  teamName: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '700' },
});
