import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentOverview } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { LeaderCard } from '../../domain/usecases/shared/statLeaders';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';
import { HighlightsAccordion } from './HighlightsAccordion';
import { TournamentTeamsStrip } from './TournamentTeamsStrip';

type Props = {
  tournament: TournamentOverview;
  leaders: LeaderCard[];
  // Opens the stats screen, on a stat key when one is given.
  onOpenStats: (statKey?: string) => void;
  onOpenTeam: (teamId: string) => void;
};

export const TournamentSummaryCard = ({ tournament, leaders, onOpenStats, onOpenTeam }: Props) => (
  <View style={styles.card}>
    <View style={styles.banner}>
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        source={require('../../../assets/images/tournament-banner-pattern.png')}
        style={styles.pattern}
      />
    </View>
    <View style={styles.identity}>
      <View style={styles.titleRow}>
        <TeamBadge logoUrl={tournament.logoUrl} name={tournament.name} size={52} />
        <Text style={styles.title}>{tournament.name}</Text>
      </View>
      {tournament.organizationName || tournament.isActive ? (
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.organization}>{tournament.organizationName}</Text>
          {tournament.isActive ? (
            <View style={styles.status}>
              <Text style={styles.statusText}>● Campeonato ativo</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {tournament.hasAggregatedPlayerStats ? (
        <TouchableOpacity accessibilityRole="button" onPress={() => onOpenStats()} style={styles.statsButton}>
          <Ionicons name="podium-outline" size={18} color={theme.colors.ink} />
          <Text style={styles.statsButtonText}>Estatísticas</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    <TournamentTeamsStrip teams={tournament.teams} onPressTeam={onOpenTeam} />
    <HighlightsAccordion cards={leaders} onSeeAll={onOpenStats} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  banner: {
    height: 44,
    overflow: 'hidden',
    backgroundColor: theme.colors.bannerEnd,
  },
  pattern: {
    position: 'absolute',
    top: -180,
    left: -60,
    width: 240,
    height: 400,
    opacity: 0.3,
    transform: [{ rotate: '-118.5deg' }],
  },
  identity: {
    padding: theme.spacing.md,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  organization: {
    flex: 1,
    color: theme.colors.subtleText,
    fontSize: 12,
  },
  status: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.olive,
  },
  // The Figma card's full-width "Estatísticas" button, under the meta row.
  statsButton: {
    minHeight: theme.layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.oliveSoft,
  },
  statsButtonText: {
    color: theme.colors.onOliveSoft,
    fontSize: 15,
    fontWeight: '600',
  },
  statusText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
});
