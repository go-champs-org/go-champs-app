import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { StatFilterOption } from '../../domain/usecases/shared/tournamentStats';
import { StatsFilters as StatsFilterValues } from '../../viewmodels/TournamentStatsViewModel';
import { makeStyles, useTheme } from '../../theme/theme';
import { SelectField } from '../forms/SelectField';

type Props = {
  phases: StatFilterOption[];
  teams: StatFilterOption[];
  minStatFilters: StatFilterOption[];
  values: StatsFilterValues;
  onPhaseChange: (phaseId: string | null) => void;
  onTeamChange: (teamId: string | null) => void;
  onMinStatChange: (slug: string, minimum: number | null) => void;
};

// Each keystroke would otherwise be a request of its own.
const MIN_STAT_DEBOUNCE_MS = 400;

// Empty or zero is no minimum at all.
export const parseMinimum = (input: string): number | null => {
  const value = Number(input);
  return input.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
};

// Keeps its own text so a half-typed value isn't reformatted, and only
// reports a settled one.
const MinStatInput = ({ filter, onChange }: { filter: StatFilterOption; onChange: Props['onMinStatChange'] }) => {
  const theme = useTheme();
  const styles = useStyles();
  const [input, setInput] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const timeout = setTimeout(() => onChange(filter.id, parseMinimum(input)), MIN_STAT_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input, filter.id, onChange]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{filter.label}</Text>
      <TextInput
        accessibilityLabel={filter.label}
        keyboardType="number-pad"
        returnKeyType="done"
        value={input}
        onChangeText={(text) => setInput(text.replace(/[^0-9]/g, ''))}
        placeholder="0"
        placeholderTextColor={theme.colors.inactive}
        style={styles.input}
      />
    </View>
  );
};

// Phases need two to be a filter, teams one; the panel holds whichever the
// tournament has, each as a select.
export const StatsFilters = ({ phases, teams, minStatFilters, values, onPhaseChange, onTeamChange, onMinStatChange }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.panel} testID="stats-filters">
      {phases.length > 1 ? (
        <SelectField label="Fase" options={[{ id: null, label: 'Todas as fases' }, ...phases]} value={values.phaseId} onChange={onPhaseChange} />
      ) : null}
      {teams.length > 0 ? (
        <SelectField label="Time" options={[{ id: null, label: 'Todos os times' }, ...teams]} value={values.teamId} onChange={onTeamChange} />
      ) : null}
      {minStatFilters.map((filter) => <MinStatInput key={filter.id} filter={filter} onChange={onMinStatChange} />)}
    </View>
  );
};

export const hasStatsFilters = (phases: StatFilterOption[], teams: StatFilterOption[], minStatFilters: StatFilterOption[]) =>
  phases.length > 1 || teams.length > 0 || minStatFilters.length > 0;

const useStyles = makeStyles((theme) => ({
  panel: {
    padding: 12,
    gap: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
  },
  field: { gap: 6 },
  label: { color: theme.colors.subtleText, fontSize: 12, fontWeight: '700' },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.sm,
    color: theme.colors.ink,
    fontSize: 14,
    backgroundColor: theme.colors.surface,
  },
}));
