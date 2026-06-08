import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tournament } from '../../models/Tournament';
import { theme } from '../../theme/theme';

type Props = {
  loading?: boolean;
  tournament: Tournament;
  onPress: () => void;
};

const initialsFromName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export const TournamentCard = ({ loading = false, tournament, onPress }: Props) => (
  <TouchableOpacity accessibilityRole="button" disabled={loading} onPress={onPress} style={styles.card}>
    <View style={styles.badge}>
      {tournament.organization.logo_url ? (
        <Image source={{ uri: tournament.organization.logo_url }} style={styles.logo} resizeMode="contain" />
      ) : (
        <Text style={styles.badgeText}>{initialsFromName(tournament.name).slice(0, 3)}</Text>
      )}
    </View>
    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={2}>
        {tournament.name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {tournament.organization.name}
      </Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={theme.colors.textSecondary} style={styles.loading} />
    ) : (
      <View style={styles.followButton}>
        <Ionicons name="lock-closed-outline" size={14} color={theme.colors.mutedText} />
        <Text style={styles.followText}>Seguir</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  badgeText: {
    color: theme.colors.mutedText,
    fontWeight: '800',
    fontSize: 14,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  followButton: {
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginLeft: theme.spacing.sm,
  },
  followText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  loading: {
    marginLeft: theme.spacing.md,
  },
});
