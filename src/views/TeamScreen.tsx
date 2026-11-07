import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTeamViewModel } from '../viewmodels/TeamViewModel';
import { makeStyles, useTheme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { TeamBanner } from '../components/team/TeamBanner';
import { TeamRosterCard } from '../components/team/TeamRosterCard';
import { CoachingStaffCard } from '../components/team/CoachingStaffCard';
import { TeamGamesCard } from '../components/team/TeamGamesCard';

type Props = { route: RouteProp<RootStackParamList, 'TeamScreen'> };

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

// A tournament team as the public site's team page shows it: the banner with
// the section tabs, then the roster with its season numbers and the coaching
// staff, or the team's games by day.
const TeamScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tournamentId, teamId, apiBaseUrl } = route.params;
  const viewModel = useTeamViewModel(tournamentId, teamId, apiBaseUrl);
  const { overview } = viewModel;

  if (viewModel.loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  if (!overview) {
    return <View style={styles.centered}><Retry message={viewModel.error ?? ''} onRetry={viewModel.retry} /></View>;
  }

  const renderPanel = () => {
    if (viewModel.activeTab === 'games') {
      return (
        <TeamGamesCard
          days={overview.gameDays}
          onPressGame={(gameId) => navigation.navigate('GameDetailScreen', { gameId, apiBaseUrl })}
          apiBaseUrl={apiBaseUrl}
        />
      );
    }
    if (viewModel.activeTab === 'roster') {
      return (
        <>
          {viewModel.rows.length > 0 ? (
            <TeamRosterCard
              rows={viewModel.rows}
              columns={viewModel.columns}
              totals={viewModel.totals}
              scopes={viewModel.scopes}
              scope={viewModel.scope}
              sort={viewModel.sort}
              onSelectScope={viewModel.selectScope}
              onSort={viewModel.sortBy}
              onPressAthlete={(playerId) => navigation.navigate('AthleteScreen', { tournamentId, playerId, apiBaseUrl })}
            />
          ) : null}
          {overview.coaches.length > 0 ? <CoachingStaffCard coaches={overview.coaches} /> : null}
        </>
      );
    }
    return <EmptyState icon="people-outline" title="Este time ainda não tem atletas nem jogos." />;
  };

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} testID="team-screen">
          <Text numberOfLines={1} style={styles.tournament}>{overview.tournamentName}</Text>
          <TeamBanner
            name={overview.team.name}
            logoUrl={overview.team.logoUrl}
            triCode={overview.team.triCode}
            tabs={viewModel.tabs}
            activeTab={viewModel.activeTab}
            onSelectTab={viewModel.selectTab}
          />
          {renderPanel()}
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
  tournament: { marginBottom: -4, color: theme.colors.olive, fontSize: 13, fontWeight: '800' },
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

export default TeamScreen;
