import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StandingsGroup } from '../../domain/usecases/GetPhaseOverviewUseCase';
import { StandingsColumn } from '../../domain/usecases/shared/standingsPresentation';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';
import { EmptyState } from '../feedback/EmptyState';

type Props = {
  columns: StandingsColumn[];
  legend: string;
  groups: StandingsGroup[];
};

const isNegative = (value: string) => /^-\d/.test(value.trim());

const StandingsCard = ({ group, columns }: { group: StandingsGroup; columns: StandingsColumn[] }) => (
  <View style={styles.group}>
    {group.title ? (
      <View style={styles.groupLabel}>
        <Text style={styles.groupLabelText}>{group.title}</Text>
      </View>
    ) : null}
    <View style={styles.table}>
      {group.rows.map((row, index) => (
        <View key={row.id} style={[styles.row, index > 0 && styles.rowDivider]}>
          <View style={styles.teamLine}>
            <Text style={styles.rank}>{index + 1}</Text>
            <TeamBadge logoUrl={row.team.logo_url} name={row.team.name} size={24} />
            <Text numberOfLines={1} style={[styles.team, index === 0 && styles.leader]}>{row.team.name}</Text>
          </View>
          <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stats}>
            {columns.map((column) => {
              const value = row.values[column.id];
              return (
                <View key={column.id} style={styles.stat}>
                  <Text style={styles.statLabel}>{column.label}</Text>
                  <Text
                    style={[
                      styles.statValue,
                      column.emphasized && styles.statEmphasized,
                      isNegative(value) && styles.statNegative,
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  </View>
);

export const StandingsSection = ({ columns, legend, groups }: Props) => {
  if (groups.length === 0) {
    return <EmptyState icon="list-outline" title="Classificação indisponível" description="Os dados desta fase ainda não foram publicados." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tabela de classificação</Text>
          {groups.length > 1 ? <Text style={styles.count}>{groups.length} grupos</Text> : null}
        </View>
        {legend ? <Text style={styles.legend}>{legend}</Text> : null}
      </View>
      {groups.map((group) => <StandingsCard key={group.id} group={group} columns={columns} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { gap: theme.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  count: { color: theme.colors.subtleText, fontSize: 12 },
  legend: { color: theme.colors.subtleText, fontSize: 11, lineHeight: 16 },
  group: { gap: 12 },
  groupLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.olive,
  },
  groupLabelText: { color: theme.colors.surface, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  table: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  row: { paddingHorizontal: 12, paddingVertical: 12, gap: theme.spacing.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.subtleBorder },
  teamLine: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rank: { width: 14, color: theme.colors.subtleText, fontSize: 12 },
  team: { flex: 1, color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  leader: { fontWeight: '900' },
  stats: { flexGrow: 1, paddingLeft: 22 },
  stat: { flex: 1, minWidth: 48, alignItems: 'center', gap: 2 },
  statLabel: { color: theme.colors.subtleText, fontSize: 10 },
  statValue: { color: theme.colors.ink, fontSize: 14 },
  statEmphasized: { fontWeight: '900' },
  statNegative: { color: theme.colors.danger, fontWeight: '900' },
});
