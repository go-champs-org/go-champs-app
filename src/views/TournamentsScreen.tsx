import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { theme } from '../theme/theme';
import { useTournamentsViewModel } from '../viewmodels/TournamentsViewModel';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/layout/AppHeader';
import { SearchBar } from '../components/search/SearchBar';
import { TournamentCard } from '../components/cards/TournamentCard';
import { PhasePickerModal } from '../components/tournaments/PhasePickerModal';
import { useTournamentEntryViewModel } from '../viewmodels/TournamentEntryViewModel';
import { MonthlyHighlights } from '../components/highlights/MonthlyHighlights';

const TournamentsScreen = () => {
  const { tournaments, loading } = useTournamentsViewModel();
  const navigation = useNavigation<any>();
  const tournamentEntry = useTournamentEntryViewModel(navigation);
  const [searchQuery, setSearchQuery] = useState('');
  const openAuth = (initialMode: 'signIn' | 'signUp' = 'signIn') => navigation.navigate('AuthScreen', { initialMode });

  const filteredTournaments = tournaments.filter((tournament) =>
    `${tournament.name} ${tournament.organization.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader onProfilePress={() => openAuth()} />
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
              <ImageBackground
                accessibilityLabel="Jogo de basquete em andamento"
                imageStyle={styles.heroImage}
                source={require('../../assets/images/home-basketball.png')}
                style={styles.hero}
              >
                <View style={styles.heroOverlay}>
                  <Text style={styles.kicker}>VEM SER</Text>
                  <Text style={styles.welcomeTitle}>GO CHAMPS</Text>
                  <Text numberOfLines={2} style={styles.heroDescription}>Acompanhe campeonatos e viva cada rodada.</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Criar conta" style={styles.primaryButton} onPress={() => openAuth('signUp')}>
                    <Text style={styles.primaryButtonText}>Criar conta</Text>
                    <Text style={styles.primaryButtonArrow}>→</Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Campeonatos em andamento</Text>
                  <Text style={styles.sectionDescription}>Jogos e resultados mais recentes</Text>
                </View>
                <Text style={styles.seeAll}>Ver todos</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum campeonato encontrado</Text>
              <Text style={styles.emptyText}>Tente buscar por outro campeonato, time ou organização.</Text>
            </View>
          }
          ListFooterComponent={<MonthlyHighlights />}
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
    paddingBottom: theme.spacing.sm,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
  hero: {
    height: 156,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  heroImage: {
    borderRadius: theme.radius.lg,
  },
  heroOverlay: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 24, 10, 0.38)',
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  welcomeTitle: {
    color: theme.colors.surface,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  heroDescription: {
    maxWidth: 240,
    marginTop: 2,
    color: theme.colors.surface,
    fontSize: theme.typography.bodySmall,
    lineHeight: 18,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '900',
  },
  primaryButtonArrow: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  sectionHeader: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.titleSmall,
    fontWeight: '900',
  },
  sectionDescription: {
    marginTop: 2,
    color: theme.colors.mutedText,
    fontSize: theme.typography.caption,
  },
  seeAll: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    paddingTop: 3,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
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
