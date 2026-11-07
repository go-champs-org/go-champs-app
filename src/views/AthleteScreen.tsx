import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAthleteViewModel } from '../viewmodels/AthleteViewModel';
import { makeStyles, useTheme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { AthleteBanner } from '../components/athlete/AthleteBanner';
import { AthleteNoStatsCard, AthleteStatsCard } from '../components/athlete/AthleteStatsCard';

type Props = { route: RouteProp<RootStackParamList, 'AthleteScreen'> };

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

// A tournament athlete as the public site's athlete page shows them: the
// banner with photo, team and games played, then their stats phase by phase.
const AthleteScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tournamentId, playerId, apiBaseUrl } = route.params;
  const viewModel = useAthleteViewModel(tournamentId, playerId, apiBaseUrl);
  const { overview, total } = viewModel;

  if (viewModel.loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  if (!overview) {
    return <View style={styles.centered}><Retry message={viewModel.error ?? ''} onRetry={viewModel.retry} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} testID="athlete-screen">
          <AthleteBanner
            name={overview.athlete.name}
            photoUrl={overview.athlete.photoUrl}
            tournamentName={overview.tournamentName}
            team={overview.team}
            gamesText={overview.gamesText}
            socialLinks={overview.socialLinks}
            onPressTeam={(teamId) => navigation.navigate('TeamScreen', { tournamentId, teamId, apiBaseUrl })}
          />
          {overview.hasStats && total ? (
            <AthleteStatsCard
              columns={viewModel.columns}
              rows={viewModel.rows}
              total={total}
              scopes={viewModel.scopes}
              scope={viewModel.scope}
              onSelectScope={viewModel.selectScope}
            />
          ) : (
            <AthleteNoStatsCard />
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

export default AthleteScreen;
