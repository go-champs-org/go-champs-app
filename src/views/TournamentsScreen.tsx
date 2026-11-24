import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Animated, Easing, Keyboard, TextInput, Pressable } from 'react-native';
import { makeStyles, useTheme } from '../theme/theme';
import { useTournamentsViewModel } from '../viewmodels/TournamentsViewModel';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';
import { HomeCampaigns } from '../components/home/HomeCampaigns';
import { AppHeader } from '../components/layout/AppHeader';
import { SearchBar } from '../components/search/SearchBar';
import { TournamentCard } from '../components/cards/TournamentCard';
import { RefreshNotice, themedRefreshControl } from '../components/feedback/RefreshFeedback';

const SEARCH_HEIGHT = 60;

// The home (Figma Home / TournamentList): the recent tournaments, pinned
// first, and the search that slides down from the header.
const TournamentsScreen = () => {
  const theme = useTheme();
  const styles = useStyles();
  const {
    tournaments,
    pinnedIds,
    togglePin,
    loading,
    searchQuery,
    setSearchQuery,
    isSearchMode,
    searching,
    refreshing,
    refreshError,
    refresh,
  } = useTournamentsViewModel();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'HomeTab'>>();
  const showAll = route.params?.showAll === true;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchProgress] = useState(() => new Animated.Value(0));
  // The input stays mounted until the closing slide ends.
  const [searchMounted, setSearchMounted] = useState(false);
  if (searchOpen && !searchMounted) setSearchMounted(true);
  const searchInput = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    Animated.timing(searchProgress, {
      toValue: searchOpen ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      if (searchOpen) searchInput.current?.focus();
      else setSearchMounted(false);
    });
  }, [searchOpen, searchProgress]);

  const toggleSearch = () => {
    if (searchOpen) {
      // Closing the search goes back to the recent tournaments.
      Keyboard.dismiss();
      setSearchQuery('');
    }
    setSearchOpen(!searchOpen);
  };

  return (
    <View style={styles.container}>
      <AppHeader searchOpen={searchOpen} onSearchPress={toggleSearch} />
      <Animated.View
        pointerEvents={searchOpen ? 'auto' : 'none'}
        style={[
          styles.headerSearch,
          {
            height: searchProgress.interpolate({ inputRange: [0, 1], outputRange: [0, SEARCH_HEIGHT] }),
            opacity: searchProgress,
          },
        ]}
      >
        {searchMounted ? (
          <SearchBar
            ref={searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nome do campeonato, organização"
          />
        ) : null}
      </Animated.View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.textSecondary} />
        </View>
      ) : (
        <FlatList
          data={showAll || isSearchMode ? tournaments : tournaments.slice(0, 4)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          // Search results answer what is typed; the pull refreshes the recent list.
          refreshControl={isSearchMode ? undefined : themedRefreshControl(theme, refreshing, refresh)}
          ListHeaderComponent={
            isSearchMode ? undefined : <>
              <RefreshNotice message={refreshError} style={styles.refreshNotice} />
              {!showAll && <HomeCampaigns />}
              <View style={styles.heading}>
                <View style={styles.headingText}>
                  <Text accessibilityRole="header" style={styles.emptyTitle}>Campeonatos em andamento</Text>
                  <Text style={styles.emptyText}>Acompanhe os jogos e resultados mais recentes</Text>
                </View>
                {(tournaments.length > 4 || showAll) && <Pressable accessibilityRole="button" style={styles.toggle}
                  onPress={() => navigation.setParams({ showAll: !showAll })}>
                  <Text style={styles.toggleText}>{showAll ? 'Ver menos' : 'Ver todos'}</Text>
                </Pressable>}
              </View>
            </>
          }
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator style={styles.searching} size="small" color={theme.colors.textSecondary} />
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhum campeonato encontrado</Text>
                <Text style={styles.emptyText}>Tente buscar por outro campeonato ou organização.</Text>
              </View>
            )
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

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSearch: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: theme.dark ? 1 : 0,
    borderBottomColor: theme.colors.chromeBorder,
  },
  searching: {
    marginTop: theme.spacing.lg,
  },
  heading: { marginVertical: 16, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  headingText: { flex: 1 },
  toggle: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  toggleText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  refreshNotice: {
    marginBottom: theme.spacing.md,
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
}));

export default TournamentsScreen;
