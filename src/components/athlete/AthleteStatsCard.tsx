import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCOPE_LABELS, StatScope } from '../../domain/usecases/shared/statLeaders';
import { StatColumn } from '../../domain/usecases/shared/tournamentStats';
import { AthleteStatsRow } from '../../viewmodels/AthleteViewModel';
import { theme } from '../../theme/theme';

type Props = {
  columns: StatColumn[];
  rows: AthleteStatsRow[];
  total: AthleteStatsRow;
  scopes: StatScope[];
  scope: StatScope;
  onSelectScope: (scope: StatScope) => void;
};

const ROW_HEIGHT = 44;
const PHASE_WIDTH = 132;
const STAT_WIDTH = 52;

// The public athlete page's "Estatísticas detalhadas": one row per phase the
// athlete played, the games in it and every stat, totals or per game, and a
// total band. The phase stays pinned while the numbers scroll under it.
export const AthleteStatsCard = ({ columns, rows, total, scopes, scope, onSelectScope }: Props) => {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const cellsOf = (row: AthleteStatsRow) => [row.games, ...row.cells];

  return (
    <View style={styles.card} testID="athlete-stats">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>Estatísticas detalhadas</Text>
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
        {glossaryOpen ? (
          <View style={styles.glossary} testID="athlete-glossary">
            <Text style={styles.glossaryItem}>
              <Text style={styles.glossaryLabel}>JG</Text> — Jogos
            </Text>
            {columns.map((column) => (
              <Text key={column.key} style={styles.glossaryItem}>
                <Text style={styles.glossaryLabel}>{column.label}</Text> — {column.description}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.table}>
        <View style={styles.phaseColumn}>
          <View style={[styles.cellRow, styles.headerBand, styles.phaseCell]}>
            <Text style={styles.bandLabel}>Fase</Text>
          </View>
          {rows.map((row) => (
            <View key={row.key} style={[styles.cellRow, styles.bodyRow, styles.phaseCell]} testID="athlete-stats-phase">
              <Text numberOfLines={1} style={styles.phaseName}>{row.label}</Text>
            </View>
          ))}
          <View style={[styles.cellRow, styles.totalsBand, styles.phaseCell]}>
            <Text style={styles.totalsLabel}>{total.label}</Text>
          </View>
        </View>
        <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.stats}>
            <View style={[styles.cellRow, styles.headerBand]}>
              <Text accessibilityLabel="Jogos" style={styles.statHeader}>JG</Text>
              {columns.map((column) => (
                <Text key={column.key} accessibilityLabel={column.description} numberOfLines={1} style={styles.statHeader}>
                  {column.label}
                </Text>
              ))}
            </View>
            {rows.map((row) => (
              <View key={row.key} style={[styles.cellRow, styles.bodyRow]}>
                {cellsOf(row).map((value, index) => (
                  <Text key={index} style={styles.statCell}>{value}</Text>
                ))}
              </View>
            ))}
            <View style={[styles.cellRow, styles.totalsBand]} testID="athlete-stats-total">
              {cellsOf(total).map((value, index) => (
                <Text key={index} style={[styles.statCell, styles.totalsCell]}>{value}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// What the card says before the athlete has a game with stats in it.
export const AthleteNoStatsCard = () => (
  <View style={[styles.card, styles.empty]} testID="athlete-stats">
    <Text style={styles.emptyText}>Sem estatísticas para este atleta ainda.</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  empty: { padding: theme.spacing.lg },
  emptyText: { color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  header: { padding: theme.spacing.md, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { flexShrink: 1, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '700' },
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
  phaseColumn: {
    width: PHASE_WIDTH,
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
  phaseCell: { paddingHorizontal: theme.spacing.md },
  bandLabel: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phaseName: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '700' },
  totalsLabel: { color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '800' },
  statHeader: {
    width: STAT_WIDTH,
    paddingHorizontal: theme.spacing.xs,
    textAlign: 'right',
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
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
