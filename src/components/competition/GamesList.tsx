import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Game } from '../../models/GameModel';
import { theme } from '../../theme/theme';
import { EmptyState } from '../feedback/EmptyState';
import { TeamBadge } from './TeamBadge';

type Props = {
  dateKeys: string[];
  selectedDate: string | null;
  onSelectDate: (value: string) => void;
  games: Game[];
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (value: string) => {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
};

export const GamesList = ({ dateKeys, selectedDate, onSelectDate, games }: Props) => {
  const index = selectedDate ? dateKeys.indexOf(selectedDate) : -1;
  const previous = index > 0 ? dateKeys[index - 1] : null;
  const next = index >= 0 && index < dateKeys.length - 1 ? dateKeys[index + 1] : null;

  return (
    <View style={styles.container}>
      {selectedDate ? (
        <View style={styles.dateNavigator}>
          <TouchableOpacity accessibilityLabel="Data anterior" disabled={!previous} onPress={() => previous && onSelectDate(previous)} style={styles.dateButton}>
            <Ionicons name="chevron-back" size={20} color={previous ? theme.colors.textPrimary : theme.colors.inactive} />
          </TouchableOpacity>
          <View style={styles.datePill}>
            <Ionicons name="calendar-clear-outline" size={16} color={theme.colors.success} />
            <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity accessibilityLabel="Próxima data" disabled={!next} onPress={() => next && onSelectDate(next)} style={styles.dateButton}>
            <Ionicons name="chevron-forward" size={20} color={next ? theme.colors.textPrimary : theme.colors.inactive} />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.metaRow}>
              <Text style={styles.time}>{formatTime(item.datetime)}</Text>
              <Text numberOfLines={1} style={styles.location}>{item.location || 'Local a definir'}</Text>
              {item.is_finished ? <Text style={styles.status}>FINAL</Text> : null}
            </View>
            <View style={styles.teamRow}>
              <View style={styles.teamIdentity}>
                <TeamBadge logoUrl={item.home_team?.logo_url} name={item.home_team?.name} />
                <Text numberOfLines={2} style={styles.teamName}>{item.home_team?.name || item.home_placeholder}</Text>
              </View>
              <Text style={styles.score}>{item.home_score ?? '-'}</Text>
            </View>
            <View style={styles.teamRow}>
              <View style={styles.teamIdentity}>
                <TeamBadge logoUrl={item.away_team?.logo_url} name={item.away_team?.name} />
                <Text numberOfLines={2} style={styles.teamName}>{item.away_team?.name || item.away_placeholder}</Text>
              </View>
              <Text style={styles.score}>{item.away_score ?? '-'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Sem partidas para esta data" description="Navegue pelas datas para consultar os próximos jogos." />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateNavigator: {
    minHeight: 56,
    marginHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    width: theme.layout.touchTarget,
    height: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateLabel: { color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '800' },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  card: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  time: { color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '900' },
  location: { flex: 1, color: theme.colors.mutedText, fontSize: theme.typography.caption },
  status: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '900' },
  teamRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  teamName: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.typography.bodySmall, fontWeight: '700' },
  score: { minWidth: 32, color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: '900', textAlign: 'right' },
});
