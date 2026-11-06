import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { CardBanner } from '../competition/CardBanner';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  name: string;
  logoUrl: string | null;
  tournamentsCountLabel: string;
};

// The public organization header: banner strip, logo and name, then the
// tournament count in its own row under a divider.
export const OrganizationSummaryCard = ({ name, logoUrl, tournamentsCountLabel }: Props) => (
  <View style={styles.card} testID="organization-summary">
    <CardBanner />
    <View style={styles.identity}>
      <TeamBadge logoUrl={logoUrl} name={name} size={64} />
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
    </View>
    <View style={styles.countRow}>
      <Text style={styles.count}>{tournamentsCountLabel}</Text>
    </View>
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
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  name: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '900',
  },
  countRow: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  count: {
    color: theme.colors.subtleText,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
