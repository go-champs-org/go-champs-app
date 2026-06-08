import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { useTournamentsViewModel } from '../viewmodels/TournamentsViewModel';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/layout/AppHeader';
import { SearchBar } from '../components/search/SearchBar';
import { TournamentCard } from '../components/cards/TournamentCard';
import { PhasePickerModal } from '../components/tournaments/PhasePickerModal';
import { useTournamentEntryViewModel } from '../viewmodels/TournamentEntryViewModel';

const TournamentsScreen = () => {
  const { tournaments, loading } = useTournamentsViewModel();
  const navigation = useNavigation<any>();
  const tournamentEntry = useTournamentEntryViewModel(navigation);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTournaments = tournaments.filter((tournament) =>
    `${tournament.name} ${tournament.organization.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader onProfilePress={() => navigation.navigate('ProfileTab')} />
      <View style={styles.headerSearch}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.textSecondary} />
        </View>
      ) : (
        <FlatList
          data={filteredTournaments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.welcomeCard}>
                <Text style={styles.kicker}>Bem-vindo</Text>
                <Text style={styles.welcomeTitle}>Acompanhe campeonatos ao vivo</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ProfileTab')}>
                  <Text style={styles.primaryButtonText}>Entrar ou criar conta</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionTitle}>Campeonatos em andamento</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum campeonato encontrado</Text>
              <Text style={styles.emptyText}>Tente buscar por outro campeonato, time ou organização.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TournamentCard
              loading={tournamentEntry.loadingTournamentId === item.id}
              tournament={item}
              onPress={() => tournamentEntry.openTournament(item)}
            />
          )}
        />
      )}
      {tournamentEntry.error ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{tournamentEntry.error}</Text>
        </View>
      ) : null}
      <PhasePickerModal
        phases={tournamentEntry.selectablePhases}
        tournament={tournamentEntry.selectedTournament}
        visible={Boolean(tournamentEntry.selectedTournament)}
        onClose={tournamentEntry.closePhasePicker}
        onSelectPhase={tournamentEntry.selectPhase}
      />
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
    paddingBottom: theme.spacing.md,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  welcomeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
  },
  welcomeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  primaryButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
  errorToast: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: 92,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
  },
  errorToastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default TournamentsScreen;
