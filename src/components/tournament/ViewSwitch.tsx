import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentView } from '../../viewmodels/TournamentViewModel';
import { makeStyles, useTheme } from '../../theme/theme';

type Props = {
  value: TournamentView;
  onChange: (value: TournamentView) => void;
};

const VIEWS: { key: TournamentView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Início', icon: 'home-outline' },
  { key: 'games', label: 'Jogos', icon: 'basketball-outline' },
];

export const ViewSwitch = ({ value, onChange }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {VIEWS.map((view) => {
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
