import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentView } from '../../viewmodels/TournamentViewModel';
import { PhaseKind } from '../../domain/usecases/shared/phasePresentation';
import { makeStyles, useTheme } from '../../theme/theme';

type Props = {
  value: TournamentView;
  phaseKind: PhaseKind;
  onChange: (value: TournamentView) => void;
};

type ViewTab = { key: TournamentView; label: string; icon: keyof typeof Ionicons.glyphMap };

// The first tab names what the selected phase shows: its standings tables or
// its bracket.
const PHASE_TABS: Record<PhaseKind, ViewTab> = {
  standings: { key: 'home', label: 'Tabelas', icon: 'grid-outline' },
  bracket: { key: 'home', label: 'Chaveamentos', icon: 'git-network-outline' },
};

const GAMES_TAB: ViewTab = { key: 'games', label: 'Jogos', icon: 'basketball-outline' };

export const ViewSwitch = ({ value, phaseKind, onChange }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  const views = [PHASE_TABS[phaseKind], GAMES_TAB];
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {views.map((view) => {
        const selected = view.key === value;
        return (
          <TouchableOpacity
            key={view.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(view.key)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Ionicons name={view.icon} size={18} color={theme.colors.onOliveSoft} />
            <Text style={styles.label}>{view.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  tabSelected: {
    backgroundColor: theme.colors.oliveSoft,
  },
  label: {
    color: theme.colors.onOliveSoft,
    fontSize: 14,
    fontWeight: '700',
  },
}));
