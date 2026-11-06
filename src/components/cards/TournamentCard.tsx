import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tournament } from '../../models/Tournament';
import { makeStyles, useTheme } from '../../theme/theme';
import { TeamBadge } from '../competition/TeamBadge';

type Props = {
  pinned?: boolean;
  tournament: Tournament;
  onPress: () => void;
  onPinPress?: () => void;
  onOrganizationPress?: () => void;
};

// A tournament on the home list (Figma Home / TournamentList, public
// TournamentMiniCard): the organization logo, the tournament name and the pin
// badge on top, the organization name below, opening the organization page.
export const TournamentCard = ({ pinned = false, tournament, onPress, onPinPress, onOrganizationPress }: Props) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <TeamBadge logoUrl={tournament.organization.logo_url} name={tournament.organization.name} size={36} />
        <Text style={styles.title} numberOfLines={2}>
          {tournament.name}
        </Text>
        {onPinPress ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={pinned ? 'Desafixar campeonato' : 'Fixar campeonato'}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={(event) => {
              event.stopPropagation?.();
              onPinPress();
            }}
            style={[styles.pinBadge, pinned && styles.pinBadgePinned]}
          >
            <Ionicons
              name={pinned ? 'pin' : 'pin-outline'}
              size={12}
              color={pinned ? theme.colors.onOlive : theme.colors.ink}
            />
            <Text style={[styles.pinText, pinned && styles.pinTextPinned]}>{pinned ? 'Fixado' : 'Fixar'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onOrganizationPress && tournament.organization.slug ? (
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel={`Abrir organização ${tournament.organization.name}`}
          hitSlop={{ top: 6, bottom: 6 }}
          onPress={(event) => {
            event.stopPropagation?.();
            onOrganizationPress();
          }}
          style={styles.organizationLink}
        >
          <Text style={styles.organization} numberOfLines={1}>
            {tournament.organization.name}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.organization} numberOfLines={1}>
          {tournament.organization.name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    gap: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.oliveSoft,
  },
  pinBadgePinned: {
    backgroundColor: theme.colors.olive,
  },
  pinText: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: '500',
  },
  pinTextPinned: {
    color: theme.colors.onOlive,
  },
  organizationLink: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  organization: {
    color: theme.colors.lime,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
}));
