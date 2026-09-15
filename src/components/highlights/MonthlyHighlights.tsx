import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';

/**
 * This is intentionally an empty state until the public API exposes a
 * cross-tournament monthly ranking. Showing fabricated athlete data would be
 * more misleading than reserving the visual slot for the real feature.
 */
export const MonthlyHighlights = () => (
  <View accessibilityLabel="Destaques do mês" style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.title}>Destaques do mês</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </View>
    <Text style={styles.description}>Acompanhe os jogos e resultados mais recentes</Text>

    <View style={styles.rankingCard}>
      <View style={styles.rankingHeader}>
        <Text style={styles.rankingTitle}>PONTOS</Text>
        <Ionicons name="trophy-outline" size={19} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.emptyRow}>
        <Ionicons name="stats-chart-outline" size={21} color={theme.colors.inactive} />
        <Text style={styles.emptyText}>Os destaques aparecem após a publicação das estatísticas.</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.titleSmall,
    fontWeight: '900',
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
    marginTop: 2,
  },
  rankingCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginTop: theme.spacing.md,
    overflow: 'hidden',
  },
  rankingHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rankingTitle: {
    color: theme.colors.success,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  emptyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.mutedText,
    flex: 1,
    fontSize: theme.typography.bodySmall,
    lineHeight: 18,
  },
});
