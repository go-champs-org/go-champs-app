import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { ContentShell } from '../components/layout/ContentShell';
import { EmptyState } from '../components/feedback/EmptyState';
import { TeamBadge } from '../components/competition/TeamBadge';
import { useGameDetailViewModel } from '../viewmodels/GameDetailViewModel';
import { BOX_SCORE_COLUMNS, BOX_SCORE_GLOSSARY } from '../data/mappers/BoxScoreMapper';
import { BoxScoreTeamSection, GameAsset } from '../models/GameDetail';

type Props = { route: RouteProp<RootStackParamList, 'GameDetailScreen'> };

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Data a definir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const assetLabel = (type: string) => {
  if (type === 'fiba-scoresheet') return 'Súmula FIBA';
  if (type === 'fiba-boxscore') return 'Boxscore FIBA';
  return type;
};

const GameDetailScreen: React.FC<Props> = ({ route }) => {
  const { gameId, apiBaseUrl } = route.params;
  const { loading, error, game, boxScore, refresh } = useGameDetailViewModel(gameId, apiBaseUrl);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.screen}>
        <ContentShell style={styles.content}>
          <EmptyState
            icon="alert-circle-outline"
            title="Jogo indisponível"
            description={error || 'Não encontramos os dados desta partida.'}
          />
          <TouchableOpacity accessibilityRole="button" onPress={() => void refresh()} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </ContentShell>
      </View>
    );
  }

  const tournamentName = game.phase?.tournament?.name || 'Campeonato';
  const venue = [game.location, game.city].filter(Boolean).join(' — ') || 'Local a definir';
  const homeName = game.home_team?.name || game.home_placeholder || 'Casa';
  const awayName = game.away_team?.name || game.away_placeholder || 'Visitante';
  const assets = (game.assets || []).filter((asset) => asset.url);

  return (
    <View style={styles.screen}>
      <ContentShell style={styles.content}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.tournament}>{tournamentName}</Text>

          {assets.length ? (
            <View style={styles.assetRow}>
              {assets.map((asset: GameAsset) => (
                <TouchableOpacity
                  key={asset.id}
                  accessibilityRole="button"
                  accessibilityLabel={assetLabel(asset.type)}
                  onPress={() => void Linking.openURL(asset.url)}
                  style={styles.assetButton}
                >
                  <Ionicons name="document-text-outline" size={16} color={theme.colors.success} />
                  <Text style={styles.assetText}>{assetLabel(asset.type)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.scoreCard}>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatDateTime(game.datetime)}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {venue}
              </Text>
            </View>
            <View style={styles.scoreboard}>
              <View style={styles.teamBlock}>
                <TeamBadge logoUrl={game.home_team?.logo_url} name={homeName} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {homeName}
                </Text>
              </View>
              <Text style={styles.score}>
                {game.home_score ?? '-'} x {game.away_score ?? '-'}
              </Text>
              <View style={styles.teamBlock}>
                <TeamBadge logoUrl={game.away_team?.logo_url} name={awayName} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {awayName}
                </Text>
              </View>
            </View>
            {game.is_finished ? <Text style={styles.finalBadge}>FINAL</Text> : null}
          </View>

          <View style={styles.boxHeader}>
            <Text style={styles.sectionTitle}>Súmula</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Glossário"
              onPress={() => setGlossaryOpen((value) => !value)}
              style={styles.glossaryButton}
            >
              <Text style={styles.glossaryButtonText}>Glossário</Text>
              <Ionicons
                name={glossaryOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.success}
              />
            </TouchableOpacity>
          </View>

          {glossaryOpen ? (
            <View style={styles.glossary}>
              {BOX_SCORE_GLOSSARY.map((item) => (
                <Text key={item.label} style={styles.glossaryItem}>
                  <Text style={styles.glossaryLabel}>{item.label}</Text> — {item.description}
                </Text>
              ))}
            </View>
          ) : null}

          {boxScore.length === 0 ? (
            <EmptyState
              icon="stats-chart-outline"
              title="Estatísticas indisponíveis"
              description="A súmula desta partida ainda não foi publicada."
            />
          ) : (
            boxScore.map((section) => <BoxScoreTable key={section.teamId} section={section} />)
          )}
        </ScrollView>
      </ContentShell>
    </View>
  );
};

const BoxScoreTable = ({ section }: { section: BoxScoreTeamSection }) => (
  <View style={styles.tableBlock}>
    <View style={styles.teamHeader}>
      <TeamBadge logoUrl={section.logoUrl} name={section.teamName} />
      <Text style={styles.teamHeaderName}>{section.teamName}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.playerCol, styles.headerCell]}>JOGADOR</Text>
          {BOX_SCORE_COLUMNS.map((column) => (
            <Text key={column.key} style={[styles.statCol, styles.headerCell]}>
              {column.label}
            </Text>
          ))}
        </View>
        {section.rows.map((row, index) => (
          <View key={row.playerId} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
            <Text style={styles.playerCol} numberOfLines={1}>
              {row.shirtNumber ? `#${row.shirtNumber} ` : ''}
              {row.playerName}
            </Text>
            {BOX_SCORE_COLUMNS.map((column) => (
              <Text key={column.key} style={styles.statCol}>
                {row.values[column.key]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  tournament: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.bodySmall,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  assetRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  assetButton: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  assetText: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '800' },
  scoreCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  meta: { flex: 1, color: theme.colors.mutedText, fontSize: theme.typography.caption, fontWeight: '700' },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: theme.spacing.xs },
  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
    textAlign: 'center',
  },
  score: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.display,
    fontWeight: '900',
  },
  finalBadge: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    color: theme.colors.success,
    fontSize: theme.typography.caption,
    fontWeight: '900',
  },
  boxHeader: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: '900',
  },
  glossaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },
  glossaryButtonText: {
    color: theme.colors.success,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  glossary: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    gap: 4,
  },
  glossaryItem: { color: theme.colors.mutedText, fontSize: theme.typography.caption, lineHeight: 18 },
  glossaryLabel: { color: theme.colors.textPrimary, fontWeight: '900' },
  tableBlock: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  teamHeaderName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accentSoft,
    minHeight: 36,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 40,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  tableRowAlt: { backgroundColor: theme.colors.surfaceMuted },
  playerCol: {
    width: 160,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: '800',
  },
  statCol: {
    width: 52,
    textAlign: 'center',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  headerCell: { fontWeight: '900', color: theme.colors.success },
  retry: {
    marginHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: theme.colors.primary, fontWeight: '900' },
});

export default GameDetailScreen;
