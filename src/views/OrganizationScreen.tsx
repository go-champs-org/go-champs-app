import React from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useOrganizationViewModel } from '../viewmodels/OrganizationViewModel';
import { tournamentsCountLabel } from '../domain/usecases/GetOrganizationOverviewUseCase';
import { makeStyles, useTheme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { OrganizationSummaryCard } from '../components/organization/OrganizationSummaryCard';
import { OrganizationTournamentRow } from '../components/organization/OrganizationTournamentRow';

type Props = { route: RouteProp<RootStackParamList, 'OrganizationScreen'> };

// The public organization page: who runs the tournaments, then each of them.
const OrganizationScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { organizationSlug, apiBaseUrl } = route.params;
  const { overview, loading, error, retry } = useOrganizationViewModel(organizationSlug, apiBaseUrl);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  if (!overview) {
    return (
      <View style={styles.centered}>
        <View style={styles.retry}>
          <Text style={styles.retryText}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={retry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <FlatList
          testID="organization-screen"
          data={overview.tournaments}
          keyExtractor={(tournament) => tournament.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <OrganizationSummaryCard
              name={overview.organization.name}
              logoUrl={overview.organization.logoUrl}
              tournamentsCountLabel={tournamentsCountLabel(overview.tournaments.length)}
            />
          }
          ListEmptyComponent={<EmptyState icon="trophy-outline" title="Nenhum campeonato encontrado" />}
          renderItem={({ item }) => (
            <OrganizationTournamentRow
              tournament={item}
              onPress={() => navigation.navigate('TournamentScreen', { tournamentId: item.id, apiBaseUrl })}
            />
          )}
        />
      </ContentShell>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: theme.spacing.md },
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

export default OrganizationScreen;
