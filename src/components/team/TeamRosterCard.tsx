import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BoxScoreRow } from '../../models/GameDetail';
import { BoxScoreSort } from '../../domain/usecases/shared/boxScore';
import { SCOPE_LABELS, StatScope } from '../../domain/usecases/shared/statLeaders';
import { formatStatValue, StatColumn } from '../../domain/usecases/shared/tournamentStats';
import { PlayerAvatar } from '../competition/PlayerAvatar';
import { theme } from '../../theme/theme';

type Props = {
  rows: BoxScoreRow[];
  columns: StatColumn[];
  totals: Record<string, string>;
  scopes: StatScope[];
  scope: StatScope;
  sort: BoxScoreSort | null;
  onSelectScope: (scope: StatScope) => void;
  onSort: (key: string) => void;
};

const ROW_HEIGHT = 44;
const NAME_WIDTH = 176;
const STAT_WIDTH = 52;

// The roster and its season numbers are one table, as on the public team
// page: shirt number, photo and name pinned while the stats scroll under
// them, a sortable header band and a totals band that adds the team up.
export const TeamRosterCard = ({ rows, columns, totals, scopes, scope, sort, onSelectScope, onSort }: Props) => {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <View style={styles.card} testID="team-roster">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>Elenco</Text>
          {columns.length > 0 ? (
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
          ) : null}
        </View>
        {scopes.length > 1 ? (
          <View accessibilityRole="tablist" accessibilityLabel="Estatísticas" style={styles.scopes}>
            {scopes.map((option) => {
              const selected = option === scope;
              return (
                <TouchableOpacity
                  key={option}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => onSelectScope(option)}
                  style={[styles.scope, selected && styles.scopeSelected]}
                >
                  <Text style={[styles.scopeText, selected && styles.scopeTextSelected]}>{SCOPE_LABELS[option]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        {glossaryOpen && columns.length > 0 ? (
          <View style={styles.glossary} testID="team-glossary">
            {columns.map((column) => (
              <Text key={column.key} style={styles.glossaryItem}>
                <Text style={styles.glossaryLabel}>{column.label}</Text> — {column.description}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.table}>
        <View style={styles.nameColumn}>
          <View style={[styles.cellRow, styles.headerBand, styles.nameCell]}>
            <Text style={[styles.bandLabel, styles.number]}>Nº</Text>
            <Text style={styles.bandLabel}>Nome</Text>
          </View>
          {rows.map((row) => (
            <View key={row.playerId} style={[styles.cellRow, styles.bodyRow, styles.nameCell]} testID="team-roster-athlete">
              <Text style={[styles.number, styles.playerNumber]}>{row.number ?? ''}</Text>
              <PlayerAvatar photoUrl={row.photoUrl} name={row.name} size={28} />
              <Text numberOfLines={1} style={styles.playerName}>{row.name}</Text>
            </View>
          ))}
          <View style={[styles.cellRow, styles.totalsBand, styles.nameCell]}>
            <Text style={styles.number} />
            <Text style={styles.totalsLabel}>Total</Text>
          </View>
        </View>
        <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.stats}>
            <View style={[styles.cellRow, styles.headerBand]}>
              {columns.map((column) => (
                <StatHeader key={column.key} column={column} sort={sort} onSort={onSort} />
              ))}
            </View>
            {rows.map((row) => (
              <View key={row.playerId} style={[styles.cellRow, styles.bodyRow]}>
                {columns.map((column) => (
                  <Text key={column.key} style={styles.statCell}>{formatStatValue(column.key, row.stats[column.key])}</Text>
                ))}
              </View>
            ))}
            <View style={[styles.cellRow, styles.totalsBand]}>
              {columns.map((column) => (
                <Text key={column.key} style={[styles.statCell, styles.totalsCell]}>
                  {formatStatValue(column.key, totals[column.key])}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const StatHeader = ({ column, sort, onSort }: { column: StatColumn; sort: BoxScoreSort | null; onSort: (key: string) => void }) => {
  const direction = sort?.slug === column.key ? sort.direction : null;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${column.description}`}
      accessibilityState={{ selected: Boolean(direction) }}
      onPress={() => onSort(column.key)}
      style={styles.statHeader}
    >
      <Text numberOfLines={1} style={styles.statHeaderLabel}>{column.label}</Text>
      {direction ? <Ionicons name={direction === 'desc' ? 'caret-down' : 'caret-up'} size={10} color={theme.colors.ink} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  header: { padding: theme.spacing.md, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '700' },
  glossaryButton: {
    height: 32,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },
  glossaryButtonText: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '800' },
  scopes: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
  },
  scope: { flex: 1, minHeight: 34, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill },
  scopeSelected: { backgroundColor: theme.colors.olive },
  scopeText: { color: theme.colors.onOliveSoft, fontSize: 13, fontWeight: '700' },
  scopeTextSelected: { color: theme.colors.surface },
  glossary: { padding: theme.spacing.md, gap: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceMuted },
  glossaryItem: { color: theme.colors.mutedText, fontSize: theme.typography.caption, lineHeight: 18 },
  glossaryLabel: { color: theme.colors.textPrimary, fontWeight: '900' },
  table: { flexDirection: 'row' },
  // The pinned column sits above the stats that scroll under it, with an
  // edge that shows where they slide.
  nameColumn: {
    width: NAME_WIDTH,
    zIndex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.colors.divider,
    backgroundColor: theme.colors.card,
  },
  scrollContent: { flexGrow: 1 },
  stats: { flexGrow: 1 },
  cellRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  headerBand: { backgroundColor: theme.colors.accentSoft },
  totalsBand: { backgroundColor: theme.colors.surfaceStrong },
  bodyRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  nameCell: { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.xs },
  number: { width: 22, textAlign: 'right' },
  bandLabel: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  playerNumber: { color: theme.colors.mutedText, fontSize: theme.typography.caption, fontVariant: ['tabular-nums'] },
  playerName: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '700' },
  totalsLabel: { color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '800' },
  statHeader: {
    width: STAT_WIDTH,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingHorizontal: theme.spacing.xs,
  },
  statHeaderLabel: { color: theme.colors.ink, fontSize: theme.typography.caption, fontWeight: '800', textTransform: 'uppercase' },
  statCell: {
    width: STAT_WIDTH,
    paddingHorizontal: theme.spacing.xs,
    textAlign: 'right',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontVariant: ['tabular-nums'],
  },
  totalsCell: { fontWeight: '800' },
});
