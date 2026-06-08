import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useGroupPhaseViewModel } from '../viewmodels/GroupPhaseViewModel';
import { theme } from '../theme/theme';

type GroupPhaseViewRouteProp = RouteProp<RootStackParamList, 'GroupPhaseView'>;

type Props = { route: GroupPhaseViewRouteProp };

const GroupPhaseView: React.FC<Props> = ({ route }) => {
  const { phaseId, tournamentId, apiBaseUrl } = route.params;
  const {
    groups,
    sortedStats,
    loading,
    activeTab,
    setActiveTab,
    dateKeys,
    selectedDate,
    setSelectedDate,
    gamesForSelectedDate,
  } = useGroupPhaseViewModel(phaseId, tournamentId, apiBaseUrl);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.textSecondary} />
      </View>
    );
  }

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {['Fase', 'Partidas'].map((tab) => {
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

  const getFirstLetter = (text: string): string => {
    if (!text || text.length === 0) return '';
    return text.charAt(0).toUpperCase();
  };

  const renderGroupTable = (group: any, rows: any[]) => {
    return (
      <View key={group.id} style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{group.title || 'Grupo'}</Text>
          {group.info && <Text style={styles.groupInfo}>{group.info}</Text>}
        </View>

        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.teamHeaderCell]}>
              <Text style={styles.headerText}>E</Text>
            </View>
            {sortedStats.map((stat) => (
              <View key={stat.id} style={styles.headerCell}>
                <Text style={styles.headerText}>{getFirstLetter(stat.title)}</Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {rows.map((row, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
              <View style={[styles.tableCell, styles.teamCell]}>
                <View style={styles.teamInfo}>
                  {row.team.logo_url ? (
                    <Image source={{ uri: row.team.logo_url }} style={styles.teamLogo} />
                  ) : (
                    <View style={styles.logoPlaceholder} />
                  )}
                  <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">
                    {row.team.name}
                  </Text>
                </View>
              </View>
              {sortedStats.map((stat) => (
                <View key={stat.id} style={styles.tableCell}>
                  <Text style={styles.cellText}>{row.stats[stat.id] ?? '-'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFase = () => {
    if (!groups || groups.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados de grupos disponíveis.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {groups.map((groupData) => renderGroupTable(groupData.group, groupData.rows))}
      </ScrollView>
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return '';
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
            <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">
              {game.home_team?.name}
            </Text>
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
            <Text style={styles.teamNameText} numberOfLines={2} ellipsizeMode="tail">
              {game.away_team?.name}
            </Text>
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
      {activeTab === 'Fase' ? renderFase() : renderPartidas()}
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  groupInfo: {
    fontSize: 12,
    color: theme.colors.mutedText,
    fontStyle: 'italic',
  },
  tableContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamHeaderCell: {
    flex: 2,
  },
  headerText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  tableRowEven: {
    backgroundColor: theme.colors.background,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCell: {
    flex: 2,
    alignItems: 'flex-start',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  teamNameText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  cellText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
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
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

export default GroupPhaseView;
