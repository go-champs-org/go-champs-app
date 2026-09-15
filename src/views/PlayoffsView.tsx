import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { usePlayoffViewModel } from '../viewmodels/PlayoffViewModel';
import { theme } from '../theme/theme';
import { SegmentedTabs } from '../components/competition/SegmentedTabs';
import { GamesList } from '../components/competition/GamesList';
import { EmptyState } from '../components/feedback/EmptyState';
import { TeamBadge } from '../components/competition/TeamBadge';
import { ContentShell } from '../components/layout/ContentShell';

type Props = { route: RouteProp<RootStackParamList, 'PlayoffsView'> };
const tabs = ['Playoffs', 'Partidas'] as const;

const PlayoffsView: React.FC<Props> = ({ route }) => {
  const { tournamentId, apiBaseUrl, phaseId } = route.params;
  const viewModel = usePlayoffViewModel(tournamentId, apiBaseUrl, phaseId);

  if (viewModel.loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <SegmentedTabs items={tabs} value={viewModel.activeTab} onChange={viewModel.setActiveTab} />
        {viewModel.activeTab === 'Playoffs' ? (
          <FlatList
            data={viewModel.draws}
            keyExtractor={(draw) => draw.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={viewModel.draws.length ? <Text style={styles.pageTitle}>Chaveamento</Text> : null}
            ListEmptyComponent={<EmptyState icon="git-branch-outline" title="Playoffs indisponíveis" description="O chaveamento aparecerá quando a fase for publicada." />}
            renderItem={({ item }) => (
              <View style={styles.round}>
                <View style={styles.roundHeader}>
                  <Text style={styles.roundTitle}>{item.title}</Text>
                  <Text style={styles.roundCount}>{item.matches.length} {item.matches.length === 1 ? 'jogo' : 'jogos'}</Text>
                </View>
                {item.matches.map((match) => {
                  const first = match.first_team_id ? viewModel.teamMap[match.first_team_id] : undefined;
                  const second = match.second_team_id ? viewModel.teamMap[match.second_team_id] : undefined;
                  const firstName = first?.name || match.first_team_placeholder || 'A definir';
                  const secondName = second?.name || match.second_team_placeholder || 'A definir';
                  return (
                    <View key={match.id} style={styles.matchCard}>
                      <Text style={styles.matchName}>{match.name || item.title}</Text>
                      <View style={styles.teamRow}>
                        <View style={styles.teamIdentity}>
                          <TeamBadge logoUrl={first?.logo_url} name={firstName} />
                          <Text numberOfLines={2} style={styles.teamName}>{firstName}</Text>
                        </View>
                        <Text style={styles.score}>{match.first_team_score ?? '-'}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.teamRow}>
                        <View style={styles.teamIdentity}>
                          <TeamBadge logoUrl={second?.logo_url} name={secondName} />
                          <Text numberOfLines={2} style={styles.teamName}>{secondName}</Text>
                        </View>
                        <Text style={styles.score}>{match.second_team_score ?? '-'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          />
        ) : (
          <GamesList
            dateKeys={viewModel.dateKeys}
            selectedDate={viewModel.selectedDate}
            onSelectDate={viewModel.setSelectedDate}
            games={viewModel.gamesForSelectedDate}
          />
        )}
      </ContentShell>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  pageTitle: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.md, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900' },
  round: { marginBottom: theme.spacing.lg },
  roundHeader: { marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundTitle: { color: theme.colors.success, fontSize: theme.typography.titleSmall, fontWeight: '900' },
  roundCount: { color: theme.colors.mutedText, fontSize: theme.typography.caption, fontWeight: '700' },
  matchCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  matchName: { marginBottom: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.caption, fontWeight: '900', textTransform: 'uppercase' },
  teamRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  teamName: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '800' },
  score: { minWidth: 36, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});

export default PlayoffsView;
