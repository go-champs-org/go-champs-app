import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentPhaseOption } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { theme } from '../../theme/theme';

type Props = {
  phases: TournamentPhaseOption[];
  selected: TournamentPhaseOption;
  onSelect: (phaseId: string) => void;
};

// Collapsed it shows only the phase on screen. The whole row is the trigger,
// with a "Trocar" chip so it reads as something to change; a tournament with
// a single phase has nothing to expand and shows no chip.
export const PhaseSelector = ({ phases, selected, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const others = phases.filter((phase) => phase.id !== selected.id);
  const canExpand = others.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Fase do campeonato</Text>
        {canExpand ? <Text style={styles.count}>{phases.length} fases</Text> : null}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Trocar fase do campeonato, atual: ${selected.title}`}
        accessibilityState={{ expanded: open, disabled: !canExpand }}
        disabled={!canExpand}
        activeOpacity={0.7}
        onPress={() => setOpen((value) => !value)}
        style={[styles.selected, canExpand && styles.selectedTappable]}
      >
        <View style={styles.selectedText}>
          <Text numberOfLines={1} style={styles.selectedTitle}>✓  {selected.title}</Text>
          {selected.isInProgress ? <Text style={styles.current}>Fase atual</Text> : null}
        </View>
        {canExpand ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{open ? 'Fechar' : 'Trocar'}</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.surface} />
          </View>
        ) : null}
      </TouchableOpacity>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  count: {
    color: theme.colors.subtleText,
    fontSize: 12,
  },
  selected: {
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.oliveSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectedTappable: {
    borderColor: theme.colors.olive,
  },
  selectedText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedTitle: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '800',
  },
  current: {
    color: theme.colors.onOliveSoft,
    fontSize: 12,
  },
  chip: {
    minHeight: 32,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.olive,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: '800',
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
