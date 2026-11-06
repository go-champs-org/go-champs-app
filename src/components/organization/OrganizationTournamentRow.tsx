import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrganizationTournament } from '../../domain/usecases/GetOrganizationOverviewUseCase';
import { makeStyles, useTheme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  tournament: OrganizationTournament;
  onPress: () => void;
};

// One tournament of the organization: its logo and name, opening the
// tournament page.
export const OrganizationTournamentRow = ({ tournament, onPress }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${tournament.name}`}
      onPress={onPress}
      style={styles.row}
    >
      <TeamBadge logoUrl={tournament.logoUrl} name={tournament.name} size={40} />
      <Text numberOfLines={1} style={styles.name}>{tournament.name}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.subtleText} />
    </TouchableOpacity>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  name: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
}));
