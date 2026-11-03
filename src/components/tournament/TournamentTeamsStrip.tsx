import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TournamentTeam } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  teams: TournamentTeam[];
};

export const TournamentTeamsStrip = ({ teams }: Props) => {
  if (teams.length === 0) return null;

  return (
    <View accessibilityLabel="Times do campeonato" style={styles.container}>
      <FlatList
        horizontal
        data={teams}
        keyExtractor={(team) => team.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.team}>
            <TeamBadge logoUrl={item.logo_url} name={item.name} size={48} />
            <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  team: {
    width: 72,
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
