import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TournamentTeam } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { carouselMaxOffset, nextCarouselOffset } from '../../domain/usecases/shared/carousel';
import { makeStyles, tokens } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  teams: TournamentTeam[];
  // Opens the team's page, as each team in the public card's row links it.
  onPressTeam: (teamId: string) => void;
};

const ITEM_MIN_WIDTH = 72;
const PADDING = tokens.spacing.md;
const GAP = tokens.spacing.sm;
const AUTO_SLIDE_MS = 5000;

// When every team fits, they share the width equally; otherwise each keeps
// the minimum width and the row scrolls.
const itemWidthFor = (containerWidth: number, count: number) => {
  const shared = (containerWidth - PADDING * 2 - GAP * (count - 1)) / count;
  return Math.max(ITEM_MIN_WIDTH, Math.floor(shared));
};

// Reduce Motion turns the automatic slide off; the row still scrolls by hand.
const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => mounted && setReduceMotion(enabled))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);
  return reduceMotion;
};

export const TournamentTeamsStrip = ({ teams, onPressTeam }: Props) => {
  const styles = useStyles();
  const [containerWidth, setContainerWidth] = useState(0);
  const listRef = useRef<FlatList<TournamentTeam>>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  // Bumped when a finger lets go, so the next slide waits a full interval.
  const [restartKey, setRestartKey] = useState(0);
  const reduceMotion = useReduceMotion();

  const itemWidth = containerWidth > 0 ? itemWidthFor(containerWidth, teams.length) : ITEM_MIN_WIDTH;
  const step = itemWidth + GAP;
  const maxOffset = containerWidth > 0 ? carouselMaxOffset(containerWidth, teams.length, itemWidth, GAP, PADDING) : 0;

  // When the teams do not all fit, the row slides one team every few
  // seconds and starts over at the end. A finger on the row pauses it.
  useEffect(() => {
    if (maxOffset <= 0 || reduceMotion) return undefined;
    const timer = setInterval(() => {
      if (draggingRef.current) return;
      const offset = nextCarouselOffset(offsetRef.current, step, maxOffset);
      listRef.current?.scrollToOffset({ offset, animated: true });
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [maxOffset, step, reduceMotion, restartKey]);

  if (teams.length === 0) return null;

  const onLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.x;
  };
  const onDragStart = () => {
    draggingRef.current = true;
  };
  const onDragEnd = () => {
    draggingRef.current = false;
    setRestartKey((key) => key + 1);
  };

  return (
    <View accessibilityLabel="Times do campeonato" onLayout={onLayout} style={styles.container}>
      <FlatList
        ref={listRef}
        horizontal
        data={teams}
        keyExtractor={(team) => team.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={onDragStart}
        onScrollEndDrag={onDragEnd}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={`Abrir time ${item.name}`}
            onPress={() => onPressTeam(item.id)}
            style={[styles.team, { width: itemWidth }]}
          >
            <TeamBadge logoUrl={item.logo_url} name={item.name} size={46} />
            <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
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
}));
