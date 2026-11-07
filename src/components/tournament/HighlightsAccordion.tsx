import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LeaderCard, SCOPE_LABELS } from '../../domain/usecases/shared/statLeaders';
import { makeStyles, useTheme } from '../../theme/theme';
import { PlayerAvatar } from '../competition/PlayerAvatar';

type Props = {
  cards: LeaderCard[];
  // Opens the full ranking of a stat key on the stats screen.
  onSeeAll: (statKey: string) => void;
};

type CardProps = {
  card: LeaderCard;
  onSeeAll: (statKey: string) => void;
};

// One stat's leaders, like the public site's card: a scope toggle when the
// stat ranks both totals and per-game averages, and a link to the full list.
const StatLeaderCard = ({ card, onSeeAll }: CardProps) => {
  const styles = useStyles();
  const [scopeIndex, setScopeIndex] = useState(0);
  const current = card.scopes[scopeIndex] ?? card.scopes[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text numberOfLines={1} style={styles.cardTitle}>{card.title}</Text>
        {card.scopes.length > 1 ? (
          <View accessibilityRole="tablist" style={styles.scopes}>
            {card.scopes.map((scope, index) => {
              const selected = index === scopeIndex;
              return (
                <TouchableOpacity
                  key={scope.scope}
                  accessibilityRole="tab"
                  accessibilityLabel={`${card.title} ${SCOPE_LABELS[scope.scope]}`}
                  accessibilityState={{ selected }}
                  onPress={() => setScopeIndex(index)}
                  style={[styles.scope, selected && styles.scopeSelected]}
                >
                  <Text style={[styles.scopeText, selected && styles.scopeTextSelected]}>{SCOPE_LABELS[scope.scope]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
      <View style={styles.rows}>
        {current.leaders.map((leader, index) => (
          <View key={leader.playerId} style={[styles.row, index > 0 && styles.rowDivider]}>
            <Text style={styles.position}>{index + 1}</Text>
            <PlayerAvatar photoUrl={leader.photoUrl} name={leader.playerName} size={36} />
            <View style={styles.playerText}>
              <Text numberOfLines={1} style={styles.player}>{leader.playerName}</Text>
              {leader.teamName ? <Text numberOfLines={1} style={styles.team}>{leader.teamName}</Text> : null}
            </View>
            <Text style={[styles.value, index === 0 && styles.valueLeader]}>{leader.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="link"
        accessibilityLabel={`Ver todos: ${card.title}`}
        onPress={() => onSeeAll(current.statKey)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Ver todos →</Text>
      </TouchableOpacity>
    </View>
  );
};

// The public site's 115deg band, dark at the top left to green at the bottom
// right; it stays dark whatever the theme.
const GRADIENT_START = { x: 0, y: 0.3 };
const GRADIENT_END = { x: 1, y: 0.7 };

// Shown only when the tournament has stat leaders to rank.
export const HighlightsAccordion = ({ cards, onSeeAll }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  if (cards.length === 0) return null;

  return (
    <LinearGradient
      colors={[theme.colors.highlightsStart, theme.colors.highlightsEnd]}
      start={GRADIENT_START}
      end={GRADIENT_END}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Destaques"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
      >
        <Ionicons name="flame" size={20} color={theme.colors.flame} />
        <Text style={styles.title}>Destaques</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.onDark} />
      </TouchableOpacity>
      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {cards.map((card) => (
            <StatLeaderCard key={card.slug} card={card} onSeeAll={onSeeAll} />
          ))}
        </ScrollView>
      ) : null}
    </LinearGradient>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    color: theme.colors.onDark,
    fontSize: 16,
    fontWeight: '700',
  },
  cards: {
    padding: theme.spacing.md,
    gap: 12,
  },
  card: {
    width: 264,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  cardHeader: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.oliveSoft,
  },
  cardTitle: {
    flex: 1,
    color: theme.colors.onOliveSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scopes: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  scope: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  scopeSelected: {
    backgroundColor: theme.colors.olive,
  },
  scopeText: {
    color: theme.colors.onOliveSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  scopeTextSelected: {
    color: theme.colors.onOlive,
  },
  rows: {
    paddingHorizontal: 12,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  position: {
    width: 12,
    color: theme.colors.subtleText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  playerText: {
    flex: 1,
    minWidth: 0,
  },
  player: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  team: {
    color: theme.colors.subtleText,
    fontSize: 11,
  },
  value: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  valueLeader: {
    color: theme.colors.olive,
    fontWeight: '900',
  },
  footer: {
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  footerText: {
    color: theme.colors.olive,
    fontSize: 12,
    fontWeight: '800',
  },
}));
