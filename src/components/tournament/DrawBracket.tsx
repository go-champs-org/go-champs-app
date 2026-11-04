import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Draw } from '../../models/PlayoffModel';
import { TeamMap } from '../../domain/usecases/shared/phasePresentation';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';
import { EmptyState } from '../feedback/EmptyState';

type Props = {
  draws: Draw[];
  teamMap: TeamMap;
};

const scoreOf = (value: string | null) => Number(value) || 0;

const Side = ({ name, logoUrl, score, winner }: { name: string; logoUrl?: string | null; score: string | null; winner: boolean }) => (
  <View style={styles.side}>
    <TeamBadge logoUrl={logoUrl} name={name} size={24} />
    <Text numberOfLines={2} style={[styles.teamName, winner ? styles.winner : styles.loser]}>{name}</Text>
    <Text style={[styles.score, winner ? styles.winnerScore : styles.loser]}>{score ?? '-'}</Text>
  </View>
);

export const DrawBracket = ({ draws, teamMap }: Props) => {
  if (draws.length === 0) {
    return <EmptyState icon="git-branch-outline" title="Chaveamento indisponível" description="O chaveamento aparecerá quando a fase for publicada." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chaveamento</Text>
      {draws.map((draw) => (
        <View key={draw.id} style={styles.round}>
          {draw.title ? <Text style={styles.roundTitle}>{draw.title}</Text> : null}
          <View style={styles.panel}>
            {draw.matches.map((match, index) => {
              const first = match.first_team_id ? teamMap[match.first_team_id] : undefined;
              const second = match.second_team_id ? teamMap[match.second_team_id] : undefined;
              const firstScore = scoreOf(match.first_team_score);
              const secondScore = scoreOf(match.second_team_score);
              return (
                <View key={match.id} style={[styles.match, index > 0 && styles.divider]}>
                  {match.name ? <Text style={styles.matchName}>{match.name}</Text> : null}
                  <Side
                    name={first?.name || match.first_team_placeholder || 'A definir'}
                    logoUrl={first?.logo_url}
                    score={match.first_team_score}
                    winner={firstScore > secondScore}
                  />
                  <Side
                    name={second?.name || match.second_team_placeholder || 'A definir'}
                    logoUrl={second?.logo_url}
                    score={match.second_team_score}
                    winner={secondScore > firstScore}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  round: { gap: theme.spacing.sm },
  roundTitle: { color: theme.colors.olive, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  panel: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  match: { padding: theme.spacing.md, gap: theme.spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: theme.colors.subtleBorder },
  matchName: { color: theme.colors.subtleText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  side: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamName: { flex: 1, fontSize: 14 },
  score: { fontSize: 16 },
  winner: { color: theme.colors.ink, fontWeight: '800' },
  winnerScore: { color: theme.colors.lime, fontWeight: '900' },
  loser: { color: theme.colors.subtleText, fontWeight: '500' },
});
