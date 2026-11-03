import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderCard } from '../../domain/usecases/shared/statLeaders';
import { theme } from '../../theme/theme';

type Props = {
  cards: LeaderCard[];
};

// Shown only when the tournament has stat leaders to rank.
export const HighlightsAccordion = ({ cards }: Props) => {
  const [open, setOpen] = useState(false);
  if (cards.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Destaques"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
      >
        <Ionicons name="flame" size={20} color={theme.colors.lime} />
        <Text style={styles.title}>Destaques</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.surface} />
      </TouchableOpacity>
      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {cards.map((card) => (
            <View key={card.slug} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              {card.leaders.map((leader, index) => (
                <View key={leader.playerId} style={styles.leader}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <View style={styles.leaderText}>
                    <Text numberOfLines={1} style={styles.player}>{leader.playerName}</Text>
                    {leader.teamName ? <Text numberOfLines={1} style={styles.team}>{leader.teamName}</Text> : null}
                  </View>
                  <Text style={styles.value}>{leader.value}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bannerEnd,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.bannerStart,
  },
  title: {
    flex: 1,
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  cards: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  card: {
    width: 220,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.olive,
    fontSize: theme.typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rank: {
    width: 14,
    color: theme.colors.subtleText,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  leaderText: {
    flex: 1,
    minWidth: 0,
  },
  player: {
    color: theme.colors.ink,
    fontSize: theme.typography.bodySmall,
    fontWeight: '800',
  },
  team: {
    color: theme.colors.subtleText,
    fontSize: theme.typography.caption,
  },
  value: {
    color: theme.colors.lime,
    fontSize: 16,
    fontWeight: '900',
  },
});
