import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useGroupPhaseViewModel } from '../viewmodels/GroupPhaseViewModel';
import { theme } from '../theme/theme';
import { SegmentedTabs } from '../components/competition/SegmentedTabs';
import { StandingsTable } from '../components/competition/StandingsTable';
import { GamesList } from '../components/competition/GamesList';
import { EmptyState } from '../components/feedback/EmptyState';
import { ContentShell } from '../components/layout/ContentShell';

type Props = { route: RouteProp<RootStackParamList, 'GroupPhaseView'> };
const tabs = ['Fase', 'Partidas'] as const;

const GroupPhaseView: React.FC<Props> = ({ route }) => {
  const { phaseId, tournamentId, apiBaseUrl } = route.params;
  const viewModel = useGroupPhaseViewModel(phaseId, tournamentId, apiBaseUrl);

  if (viewModel.loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <SegmentedTabs items={tabs} value={viewModel.activeTab} onChange={viewModel.setActiveTab} />
        {viewModel.activeTab === 'Fase' ? (
          viewModel.groups.length ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {viewModel.groups.map(({ group, rows }) => (
                <View key={group.id} style={styles.group}>
                  <Text style={styles.eyebrow}>CLASSIFICAÇÃO</Text>
                  <Text style={styles.title}>{group.title || 'Grupo'}</Text>
                  {group.info ? <Text style={styles.description}>{group.info}</Text> : null}
                  <View style={styles.tableWrap}>
                    <StandingsTable rows={rows} stats={viewModel.sortedStats} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <EmptyState title="Grupos indisponíveis" description="A organização ainda não publicou esta fase." />
          )
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
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  group: { marginBottom: theme.spacing.lg },
  eyebrow: { color: theme.colors.textSecondary, fontSize: theme.typography.caption, fontWeight: '900' },
  title: { marginTop: 2, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900' },
  description: { marginTop: theme.spacing.xs, color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  tableWrap: { marginTop: theme.spacing.md },
});

export default GroupPhaseView;
