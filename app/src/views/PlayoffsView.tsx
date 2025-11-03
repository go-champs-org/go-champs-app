import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { usePlayoffViewModel } from '../viewmodels/PlayoffViewModel';
import { theme } from '../theme/theme';

type PlayoffsViewRouteProp = RouteProp<RootStackParamList, 'PlayoffsView'>;

type Props = { route: PlayoffsViewRouteProp };

const PlayoffsView: React.FC<Props> = ({ route }) => {
  const { tournamentId } = route.params;
  const {
    draws,
    loading,
    activeTab,
    setActiveTab,
    dateKeys,
    selectedDate,
    setSelectedDate,
    gamesForSelectedDate,
    teamMap,
  } = usePlayoffViewModel(tournamentId);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.textSecondary} />
      </View>
    );
  }

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {['Playoffs', 'Partidas'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPlayoffs = () => (
    <FlatList
      data={draws}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          {item.matches.map((match) => {
            const first = match.first_team_id ? teamMap[match.first_team_id] : undefined;
            const second = match.second_team_id ? teamMap[match.second_team_id] : undefined;
            return (
              <View key={match.id} style={styles.card}>
                <Text style={styles.matchName}>{match.name}</Text>
                <View style={styles.matchContent}>
                  <View style={[styles.teamInfo, { flex: 1 }] }>
                    {first?.logo_url ? (
                      <Image source={{ uri: first.logo_url }} style={[styles.teamLogo, styles.teamLogoLeft]} />
                    ) : (
                      <View style={styles.logoPlaceholder} />
                    )}
                    <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">
                      {first?.name ?? match.first_team_placeholder ?? ''}
                    </Text>
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={styles.score}>{match.first_team_score ?? ''}</Text>
                    <Text style={styles.score}>x</Text>
                    <Text style={styles.score}>{match.second_team_score ?? ''}</Text>
                  </View>
                  <View style={[styles.teamInfo, { flex: 1, justifyContent: 'flex-end' }]}>
                    <Text style={[styles.teamNameText, { textAlign: 'right' }]} numberOfLines={2} ellipsizeMode="tail">
                      {second?.name ?? match.second_team_placeholder ?? ''}
                    </Text>
                    {second?.logo_url ? (
                      <Image source={{ uri: second.logo_url }} style={[styles.teamLogo, styles.teamLogoRight]} />
                    ) : (
                      <View style={styles.logoPlaceholder} />
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    />
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return '';
    // Expecting YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dd}/${mm}`;
  };

  const renderDateSelector = () => {
    if (!selectedDate || dateKeys.length === 0) return null;

    const idx = dateKeys.indexOf(selectedDate);
    const canPrev = idx > 0;
    const canNext = idx >= 0 && idx < dateKeys.length - 1;

    const goPrev = () => {
      if (!canPrev) return;
      setSelectedDate(dateKeys[idx - 1]);
    };
    const goNext = () => {
      if (!canNext) return;
      setSelectedDate(dateKeys[idx + 1]);
    };

    return (
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goPrev} disabled={!canPrev} style={styles.navButton}>
          <Text style={[styles.navButtonText, !canPrev && styles.navButtonTextDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
        <TouchableOpacity onPress={goNext} disabled={!canNext} style={styles.navButton}>
          <Text style={[styles.navButtonText, !canNext && styles.navButtonTextDisabled]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGameCard = (game: any) => {
    return (
      <View style={styles.card}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTime}>{formatTime(game.datetime)}</Text>
          <Text style={styles.gameLocation}>{game.location}</Text>
          {game.is_finished ? <Text style={styles.finished}>Final</Text> : null}
        </View>

        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            {game.home_team?.logo_url ? (
              <Image source={{ uri: game.home_team.logo_url }} style={styles.teamLogo} />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
            <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">{game.home_team?.name}</Text>
          </View>
          <Text style={styles.teamScore}>{game.home_score}</Text>
        </View>

        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            {game.away_team?.logo_url ? (
              <Image source={{ uri: game.away_team.logo_url }} style={styles.teamLogo} />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
            <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">{game.away_team?.name}</Text>
          </View>
          <Text style={styles.teamScore}>{game.away_score}</Text>
        </View>
      </View>
    );
  };

  const renderPartidas = () => (
    <View style={{ flex: 1 }}>
      {renderDateSelector()}
      <FlatList
        data={gamesForSelectedDate}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => renderGameCard(item)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Sem partidas para esta data.</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderTabBar()}
      {activeTab === 'Playoffs' ? renderPlayoffs() : renderPartidas()}
    </View>
  );
};

const screenWidth = Dimensions.get('window').width; // Get screen width

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center', // Center section content
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center', // Center section title
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 20, // Updated padding to 20 on all sides
    marginBottom: 8,
    width: screenWidth - 20, // Set card width relative to screen size
    alignSelf: 'center', // Center the card horizontally
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center', // Center card content
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 8,
    color: theme.colors.textSecondary,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensure equal spacing between elements
    width: '100%', // Match content width to parent
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  teamName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginHorizontal: 4,
    textAlign: 'center', // Center-align team names
    flex: 1, // Allow team names to take up equal space
    flexWrap: 'wrap', // Enable wrapping for long names
  },
  score: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    marginHorizontal: 2, // Reduced margin for closer alignment
    textAlign: 'center', // Center-align scores
    width: 30, // Reduced width for scores
  },
  dateList: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navButtonText: {
    fontSize: 22,
    color: theme.colors.primary,
  },
  navButtonTextDisabled: {
    color: theme.colors.mutedText,
    opacity: 0.5,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#efefef',
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  dateChipActive: {
    backgroundColor: theme.colors.primary,
  },
  dateChipText: {
    color: theme.colors.textPrimary,
  },
  dateChipTextActive: {
    color: theme.colors.background,
  },
  gameHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTime: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  gameLocation: {
    color: theme.colors.mutedText,
  },
  finished: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  teamLogoLeft: {
    marginRight: 12,
  },
  teamLogoRight: {
    marginLeft: 12,
    marginRight: 0,
  },
  logoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  teamNameText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  teamScore: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'normal',
    width: 40,
    textAlign: 'right',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

export default PlayoffsView;
