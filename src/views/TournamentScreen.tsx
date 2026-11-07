import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTournamentViewModel } from '../viewmodels/TournamentViewModel';
import { makeStyles, useTheme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { TournamentSummaryCard } from '../components/tournament/TournamentSummaryCard';
import { PhaseSelector } from '../components/tournament/PhaseSelector';
import { ViewSwitch } from '../components/tournament/ViewSwitch';
import { StandingsSection } from '../components/tournament/StandingsSection';
import { DrawBracket } from '../components/tournament/DrawBracket';
import { GamesPanel } from '../components/tournament/GamesPanel';

type Props = { route: RouteProp<RootStackParamList, 'TournamentScreen'> };

const Retry = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const styles = useStyles();
  return (
    <View style={styles.retry}>
      <Text style={styles.retryText}>{message}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
};

const TournamentScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tournamentId, phaseId, apiBaseUrl } = route.params;
  const viewModel = useTournamentViewModel(tournamentId, phaseId, apiBaseUrl);
  const { tournament, selectedPhase, phase } = viewModel;

  if (viewModel.loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  if (!tournament) {
    return <View style={styles.centered}><Retry message={viewModel.error ?? ''} onRetry={viewModel.retry} /></View>;
  }

  const openTeam = (teamId: string) => navigation.navigate('TeamScreen', { tournamentId, teamId, apiBaseUrl });

  const renderPhaseContent = () => {
    if (viewModel.phaseLoading) return <ActivityIndicator style={styles.phaseLoader} color={theme.colors.accent} />;
    if (viewModel.phaseError) return <Retry message={viewModel.phaseError} onRetry={viewModel.retryPhase} />;
    if (!phase || !selectedPhase) return null;

    if (viewModel.activeView === 'games') {
      return (
        <GamesPanel
          phaseTitle={selectedPhase.title}
          dateKeys={viewModel.dateKeys}
          selectedDate={viewModel.selectedDate}
          onSelectDate={viewModel.setSelectedDate}
          games={viewModel.gamesForSelectedDate}
          onPressGame={(gameId) => navigation.navigate('GameDetailScreen', { gameId, apiBaseUrl })}
          onPressTeam={openTeam}
          apiBaseUrl={apiBaseUrl}
        />
      );
    }

    return phase.kind === 'standings'
      ? <StandingsSection columns={phase.columns} groups={phase.groups} onPressTeam={openTeam} />
      : <DrawBracket draws={phase.draws} teamMap={phase.teamMap} onPressTeam={openTeam} />;
  };

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TournamentSummaryCard
            tournament={tournament}
            leaders={viewModel.leaders}
            onOpenStats={(statKey) => navigation.navigate('TournamentStatsScreen', { tournamentId, statKey, apiBaseUrl })}
            onOpenTeam={openTeam}
            onOpenOrganization={(organizationSlug) => navigation.navigate('OrganizationScreen', { organizationSlug, apiBaseUrl })}
          />
          {selectedPhase ? (
            <>
              <PhaseSelector phases={viewModel.phases} selected={selectedPhase} onSelect={viewModel.selectPhase} />
              <ViewSwitch value={viewModel.activeView} onChange={viewModel.setActiveView} />
              {renderPhaseContent()}
            </>
          ) : (
            <EmptyState icon="layers-outline" title="Este campeonato ainda não possui fases disponíveis." />
          )}
        </ScrollView>
      </ContentShell>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: theme.spacing.md },
  phaseLoader: { marginVertical: theme.spacing.xl },
  retry: { padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.md },
  retryText: { color: theme.colors.textPrimary, fontSize: theme.typography.body, textAlign: 'center' },
  retryButton: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.oliveSoft,
  },
  retryButtonText: { color: theme.colors.onOliveSoft, fontSize: 14, fontWeight: '800' },
}));

export default TournamentScreen;
