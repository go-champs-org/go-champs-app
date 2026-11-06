import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Organization } from '../../models/Organization';
import { theme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  organization: Organization;
  onPress: () => void;
};

// One organization of the list opened from the menu (public home
// OrganizationsSidebar): its logo and name, opening the organization page.
export const OrganizationRow = ({ organization, onPress }: Props) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`Abrir organização ${organization.name}`}
    onPress={onPress}
    style={styles.row}
  >
    <TeamBadge logoUrl={organization.logo_url} name={organization.name} size={32} />
    <Text numberOfLines={1} style={styles.name}>{organization.name}</Text>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.subtleText} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  name: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
