import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { useTournamentsViewModel } from '../viewmodels/TournamentsViewModel';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/layout/AppHeader';
import { SearchBar } from '../components/search/SearchBar';
import { TournamentCard } from '../components/cards/TournamentCard';

// The home (Figma Home / TournamentList): the search under the header and the
// recent tournaments, pinned first.
const TournamentsScreen = () => {
  const { tournaments, pinnedIds, togglePin, loading, searchQuery, setSearchQuery } = useTournamentsViewModel();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <AppHeader onProfilePress={() => navigation.navigate('AuthScreen', { initialMode: 'signIn' })} />
      <View style={styles.headerSearch}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.textSecondary} />
        </View>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum campeonato encontrado</Text>
              <Text style={styles.emptyText}>Tente buscar por outro campeonato ou organização.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TournamentCard
              pinned={pinnedIds.has(item.id)}
              tournament={item}
              onPress={() => navigation.navigate('TournamentScreen', { tournamentId: item.id, apiBaseUrl: item.apiBaseUrl })}
              onPinPress={() => {
                void togglePin(item.id);
              }}
              onOrganizationPress={() =>
                navigation.navigate('OrganizationScreen', { organizationSlug: item.organization.slug, apiBaseUrl: item.apiBaseUrl })
              }
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSearch: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
});

export default TournamentsScreen;
