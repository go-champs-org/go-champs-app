import React, { useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { TournamentTeam } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  teams: TournamentTeam[];
};

const ITEM_MIN_WIDTH = 72;
const PADDING = theme.spacing.md;
const GAP = theme.spacing.sm;

// When every team fits, they share the width equally; otherwise each keeps
// the minimum width and the row scrolls.
const itemWidthFor = (containerWidth: number, count: number) => {
  const shared = (containerWidth - PADDING * 2 - GAP * (count - 1)) / count;
  return Math.max(ITEM_MIN_WIDTH, Math.floor(shared));
};

export const TournamentTeamsStrip = ({ teams }: Props) => {
  const [containerWidth, setContainerWidth] = useState(0);
  if (teams.length === 0) return null;

  const itemWidth = containerWidth > 0 ? itemWidthFor(containerWidth, teams.length) : ITEM_MIN_WIDTH;
  const onLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);

  return (
    <View accessibilityLabel="Times do campeonato" onLayout={onLayout} style={styles.container}>
      <FlatList
        horizontal
        data={teams}
        keyExtractor={(team) => team.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.team, { width: itemWidth }]}>
            <TeamBadge logoUrl={item.logo_url} name={item.name} size={46} />
            <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  list: {
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  team: {
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
});
