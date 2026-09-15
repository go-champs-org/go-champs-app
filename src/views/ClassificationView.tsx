import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useClassificationViewModel } from '../viewmodels/ClassificationViewModel';
import { theme } from '../theme/theme';
import { SegmentedTabs } from '../components/competition/SegmentedTabs';
import { StandingsTable } from '../components/competition/StandingsTable';
import { GamesList } from '../components/competition/GamesList';
import { EmptyState } from '../components/feedback/EmptyState';
import { ContentShell } from '../components/layout/ContentShell';

type Props = { route: RouteProp<RootStackParamList, 'ClassificationView'> };
const tabs = ['Classificação', 'Partidas'] as const;

const ClassificationView: React.FC<Props> = ({ route }) => {
  const { phaseId, tournamentId, apiBaseUrl } = route.params;
  const viewModel = useClassificationViewModel(phaseId, tournamentId, apiBaseUrl);

  if (viewModel.loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <SegmentedTabs items={tabs} value={viewModel.activeTab} onChange={viewModel.setActiveTab} />
        {viewModel.activeTab === 'Classificação' ? (
          viewModel.classificationRows.length ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.eyebrow}>TABELA GERAL</Text>
              <Text style={styles.title}>Classificação</Text>
              <Text style={styles.description}>Deslize a tabela para conferir todas as estatísticas.</Text>
              <View style={styles.tableWrap}>
                <StandingsTable rows={viewModel.classificationRows} stats={viewModel.sortedStats} />
              </View>
            </ScrollView>
          ) : (
            <EmptyState title="Classificação indisponível" description="Os dados desta fase ainda não foram publicados." />
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
  eyebrow: { color: theme.colors.textSecondary, fontSize: theme.typography.caption, fontWeight: '900' },
  title: { marginTop: 2, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900' },
  description: { marginTop: theme.spacing.xs, color: theme.colors.mutedText, fontSize: theme.typography.bodySmall },
  tableWrap: { marginTop: theme.spacing.md },
});

export default ClassificationView;
