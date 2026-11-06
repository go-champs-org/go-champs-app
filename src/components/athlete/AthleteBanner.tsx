import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialLink, SocialNetwork } from '../../domain/usecases/shared/athleteProfile';
import { PlayerAvatar } from '../competition/PlayerAvatar';
import { BANNER_TEXT, ProfileBanner } from '../competition/ProfileBanner';

type Props = {
  name: string;
  photoUrl: string | null;
  tournamentName: string;
  team: { id: string; name: string } | null;
  gamesText: string;
  socialLinks: SocialLink[];
  onPressTeam: (teamId: string) => void;
};

const PHOTO_SIZE = 84;
const PHOTO_RING = 4;
const PHOTO_RING_COLOR = '#a6cd63';

const SOCIAL_ICONS: Record<SocialNetwork, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  twitter: 'logo-twitter',
  facebook: 'logo-facebook',
};

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter',
  facebook: 'Facebook',
};

// The public athlete banner as a phone shows it, centred: the photo in its
// green ring, the tournament as an overline, the name, the team and the games
// played, then the athlete's social networks.
export const AthleteBanner = ({ name, photoUrl, tournamentName, team, gamesText, socialLinks, onPressTeam }: Props) => (
  <ProfileBanner testID="athlete-banner">
    <View style={styles.identity}>
      <View style={styles.photoRing}>
        <PlayerAvatar photoUrl={photoUrl} name={name} size={PHOTO_SIZE - PHOTO_RING * 2} />
      </View>
      {tournamentName ? <Text numberOfLines={2} style={styles.overline}>{tournamentName}</Text> : null}
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
      {team || gamesText ? (
        <Text style={styles.subtitle}>
          {team ? (
            <Text accessibilityRole="link" onPress={() => onPressTeam(team.id)} style={styles.teamLink} testID="athlete-team-link">
              {team.name}
            </Text>
          ) : null}
          {team && gamesText ? ' · ' : ''}
          {gamesText}
        </Text>
      ) : null}
      {socialLinks.length > 0 ? (
        <View style={styles.socials}>
          {socialLinks.map(({ network, url }) => (
            <TouchableOpacity
              key={network}
              accessibilityRole="link"
              accessibilityLabel={SOCIAL_LABELS[network]}
              onPress={() => void Linking.openURL(url)}
              style={styles.social}
            >
              <Ionicons name={SOCIAL_ICONS[network]} size={16} color={BANNER_TEXT} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  </ProfileBanner>
);

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: 8 },
  photoRing: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: PHOTO_RING,
    borderColor: PHOTO_RING_COLOR,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: '#f5f5f5',
  },
  overline: {
    color: BANNER_TEXT,
    opacity: 0.85,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.96,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  name: {
    color: BANNER_TEXT,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: { color: BANNER_TEXT, opacity: 0.9, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  teamLink: { textDecorationLine: 'underline' },
  socials: { marginTop: 4, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  social: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(245, 245, 245, 0.15)',
  },
});
