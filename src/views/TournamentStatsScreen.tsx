import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { SCOPE_LABELS } from '../domain/usecases/shared/statLeaders';
import { useTournamentStatsViewModel } from '../viewmodels/TournamentStatsViewModel';
import { makeStyles, useTheme } from '../theme/theme';
import { RefreshNotice, themedRefreshControl } from '../components/feedback/RefreshFeedback';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { StatsTable, StatsTableHeader, useStatsTableScroll } from '../components/tournament/StatsTable';
import { hasStatsFilters, StatsFilters } from '../components/tournament/StatsFilters';

type Props = { route: RouteProp<RootStackParamList, 'TournamentStatsScreen'> };

const NO_STATS = 'Sem estatísticas para este campeonato ainda.';
// Heading, top of the card, then the table header.
const STICKY_HEADER_INDEX = 2;
const NO_FILTERED_STATS = 'Nenhum atleta atende a esses filtros.';

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

type ToggleProps = { label: string; icon: keyof typeof Ionicons.glyphMap; open: boolean; onPress: () => void };

const Toggle = ({ label, icon, open, onPress }: ToggleProps) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={[styles.toggle, open && styles.toggleOpen]}
    >
      <Ionicons name={icon} size={16} color={theme.colors.onOliveSoft} />
      <Text style={styles.toggleText}>{label}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.onOliveSoft} />
    </TouchableOpacity>
  );
};

// The tournament's athletes ranked by one stat, like the public site's stats
// page: Totais or Por jogo, any column tapped to rank by it, narrowed by
// phase, team and minimum games.
const TournamentStatsScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tournamentId, statKey: requestedStatKey, apiBaseUrl } = route.params;
  const viewModel = useTournamentStatsViewModel(tournamentId, requestedStatKey, apiBaseUrl);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const { headerRef: tableHeaderRef, onScroll: onTableScroll } = useStatsTableScroll();
  const { tournament, layout, columns } = viewModel;

  if (viewModel.loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  }

  if (!tournament || !layout) {
    return <View style={styles.centered}><Retry message={viewModel.error ?? ''} onRetry={viewModel.retry} /></View>;
  }

  const showFilters = hasStatsFilters(layout.phases, layout.teams, layout.minStatFilters);
  const hasStats = layout.scopes.length > 0;
  const showTable = hasStats && !viewModel.rowsError;
  const filtersLabel = viewModel.activeFilterCount > 0 ? `Filtros (${viewModel.activeFilterCount})` : 'Filtros';

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        {/* The table header is a child of its own so it can stick to the top
            while the rows scroll under it. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={showTable ? [STICKY_HEADER_INDEX] : undefined}
          refreshControl={themedRefreshControl(theme, viewModel.refreshing, viewModel.refresh)}
        >
          {/* Inside the heading, so the sticky header keeps its index. */}
          <View style={styles.heading}>
            <RefreshNotice message={viewModel.refreshError} style={styles.refreshNotice} />
            <Text numberOfLines={1} style={styles.tournament}>{tournament.name}</Text>
            <Text style={styles.title}>Estatísticas do campeonato</Text>
          </View>
          {!hasStats ? (
            <EmptyState icon="stats-chart-outline" title={NO_STATS} />
          ) : (
            // Controls and table read as one card, like the public site's page.
            <View style={[styles.card, styles.cardTop]}>
              <View style={styles.controls}>
                <View style={styles.toggles}>
                  {showFilters ? (
                    <Toggle label={filtersLabel} icon="filter" open={filtersOpen} onPress={() => setFiltersOpen((value) => !value)} />
                  ) : null}
                  <Toggle label="Glossário" icon="book-outline" open={glossaryOpen} onPress={() => setGlossaryOpen((value) => !value)} />
                </View>
                {showFilters ? (
                  // Hidden, not unmounted: a minimum typed before closing is
                  // still there when the panel opens again.
                  <View style={!filtersOpen && styles.hidden}>
                    <StatsFilters
                      phases={layout.phases}
                      teams={layout.teams}
                      minStatFilters={layout.minStatFilters}
                      values={viewModel.filters}
                      onPhaseChange={viewModel.selectPhase}
                      onTeamChange={viewModel.selectTeam}
                      onMinStatChange={viewModel.setMinStat}
                    />
                  </View>
                ) : null}
                {glossaryOpen ? (
                  <View style={styles.glossary} testID="stats-glossary">
                    {columns.map((column) => (
                      <Text key={column.key} style={styles.glossaryItem}>
                        <Text style={styles.glossaryTerm}>{column.label}</Text>  {column.description}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {layout.scopes.length > 1 ? (
                  <View accessibilityRole="tablist" style={styles.scopes}>
                    {layout.scopes.map((scope) => {
                      const selected = scope === viewModel.scope;
                      return (
                        <TouchableOpacity
                          key={scope}
                          accessibilityRole="tab"
                          accessibilityState={{ selected }}
                          onPress={() => viewModel.selectScope(scope)}
                          style={[styles.scope, selected && styles.scopeSelected]}
                        >
                          <Text style={[styles.scopeText, selected && styles.scopeTextSelected]}>{SCOPE_LABELS[scope]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>
          )}
          {showTable ? (
            <View style={styles.cardSides}>
              <StatsTableHeader columns={columns} statKey={viewModel.statKey} scrollRef={tableHeaderRef} onSelectStat={viewModel.selectStat} />
            </View>
          ) : null}
          {hasStats ? (
            <View style={[styles.card, styles.cardBottom]}>
              {viewModel.rowsError ? (
                <Retry message={viewModel.rowsError} onRetry={viewModel.retryRows} />
              ) : (
                <StatsTable
                  columns={columns}
                  rows={viewModel.rows}
                  statKey={viewModel.statKey}
                  loading={viewModel.rowsLoading}
                  emptyLabel={viewModel.activeFilterCount > 0 ? NO_FILTERED_STATS : NO_STATS}
                  onScroll={onTableScroll}
                  onPressAthlete={(playerId) => navigation.navigate('AthleteScreen', { tournamentId, playerId, apiBaseUrl })}
                />
              )}
            </View>
          ) : null}
        </ScrollView>
      </ContentShell>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  refreshNotice: { marginBottom: theme.spacing.md },
  heading: { gap: 2, marginBottom: 12 },
  tournament: { color: theme.colors.olive, fontSize: 13, fontWeight: '800' },
  title: { color: theme.colors.ink, fontSize: 22, fontWeight: '900' },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
  },
  cardTop: {
    borderBottomWidth: 0,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  cardSides: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.oliveSoft,
  },
  cardBottom: {
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
  controls: { padding: 12, gap: 10 },
  scopes: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
  },
  scope: { flex: 1, minHeight: 34, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill },
  scopeSelected: { backgroundColor: theme.colors.olive },
  scopeText: { color: theme.colors.onOliveSoft, fontSize: 13, fontWeight: '700' },
  scopeTextSelected: { color: theme.colors.onOlive },
  toggles: { flexDirection: 'row', gap: theme.spacing.sm },
  toggle: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.tint,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  toggleOpen: { backgroundColor: theme.colors.oliveSoft },
  toggleText: { color: theme.colors.onOliveSoft, fontSize: 13, fontWeight: '700' },
  hidden: { display: 'none' },
  glossary: {
    padding: 12,
    gap: 6,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
  },
  glossaryItem: { color: theme.colors.subtleText, fontSize: 12 },
  glossaryTerm: { color: theme.colors.ink, fontWeight: '900' },
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

export default TournamentStatsScreen;
