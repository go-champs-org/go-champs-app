import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentPhaseOption } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { makeStyles, useTheme } from '../../theme/theme';

type Props = {
  phases: TournamentPhaseOption[];
  selected: TournamentPhaseOption;
  onSelect: (phaseId: string) => void;
};

export const PhaseSelector = ({ phases, selected, onSelect }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
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
        style={styles.selected}
      >
        <Text numberOfLines={2} style={styles.selectedTitle}>{selected.title}</Text>
        {canExpand && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.ink} />}
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

const useStyles = makeStyles((theme) => ({
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
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectedTitle: { flex: 1, color: theme.colors.ink, fontSize: 15, fontWeight: '700' },
  options: { gap: 4 },
  option: {
    minHeight: 44,
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
}));
