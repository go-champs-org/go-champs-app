import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TournamentPhaseOption } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { theme } from '../../theme/theme';

type Props = {
  phases: TournamentPhaseOption[];
  selected: TournamentPhaseOption;
  onSelect: (phaseId: string) => void;
};

// Collapsed it shows only the phase on screen; a tournament with a single
// phase has nothing to expand.
export const PhaseSelector = ({ phases, selected, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const others = phases.filter((phase) => phase.id !== selected.id);
  const canExpand = others.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Fase do campeonato"
        accessibilityState={{ expanded: open, disabled: !canExpand }}
        disabled={!canExpand}
        onPress={() => setOpen((value) => !value)}
      >
        <Text style={styles.label}>Fase do campeonato{canExpand ? (open ? '  ▴' : '  ▾') : ''}</Text>
      </TouchableOpacity>
      <View style={styles.selected}>
        <Text numberOfLines={1} style={styles.selectedTitle}>✓  {selected.title}</Text>
        {selected.isInProgress ? <Text style={styles.current}>Fase atual</Text> : null}
      </View>
      {open ? (
        <View style={styles.options}>
          {others.map((phase) => (
            <TouchableOpacity
              key={phase.id}
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                onSelect(phase.id);
              }}
              style={styles.option}
            >
              <Text numberOfLines={2} style={styles.optionTitle}>{phase.title}</Text>
              {phase.isInProgress ? <Text style={styles.optionCurrent}>Fase atual</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  selected: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.oliveSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  selectedTitle: {
    flex: 1,
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '800',
  },
  current: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '500',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.sm,
  },
  optionTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.bodySmall,
    fontWeight: '700',
  },
  optionCurrent: {
    color: theme.colors.olive,
    fontSize: theme.typography.caption,
  },
});
