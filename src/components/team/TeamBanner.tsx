import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamTab, TeamTabId } from '../../viewmodels/TeamViewModel';
import { TeamBadge } from '../competition/TeamBadge';
import { theme } from '../../theme/theme';

type Props = {
  name: string;
  logoUrl: string | null;
  triCode: string | null;
  tabs: TeamTab[];
  activeTab: TeamTabId | null;
  onSelectTab: (tab: TeamTabId) => void;
};

// The public profile banner's green (packages/ui ProfileBanner): a 115° sweep
// whose last stop sits past the edge, so the card ends on the mix it reaches
// there. Literal colors: the banner stays green whatever the theme.
const BANNER_COLORS = ['#2f4419', '#4d6b2c', '#68873d'] as const;
const BANNER_LOCATIONS = [0, 0.55, 1] as const;
const BANNER_TEXT = '#f5f5f5';
const ACTIVE_TAB_TEXT = '#4d6b2c';

// What a phone shows of the public team banner: logo, name, tri code and the
// section tabs. The overline and the highlights box are what a narrow screen
// drops there, so they are not here either.
export const TeamBanner = ({ name, logoUrl, triCode, tabs, activeTab, onSelectTab }: Props) => (
  <LinearGradient
    colors={BANNER_COLORS}
    locations={BANNER_LOCATIONS}
    start={{ x: 0, y: 0.29 }}
    end={{ x: 1, y: 0.71 }}
    style={styles.banner}
    testID="team-banner"
  >
    <View style={styles.identity}>
      <TeamBadge logoUrl={logoUrl} name={name} size={84} />
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
      {triCode ? <Text style={styles.triCode}>{triCode}</Text> : null}
    </View>
    {/* A single section has nothing to switch between: no tab bar. */}
    {tabs.length > 1 ? (
      <View accessibilityRole="tablist" accessibilityLabel="Seções do time" style={styles.tabs}>
        {tabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onSelectTab(tab.id)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ) : null}
  </LinearGradient>
);

const styles = StyleSheet.create({
  banner: {
    overflow: 'hidden',
    padding: 20,
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  identity: { alignItems: 'center', gap: 12 },
  name: {
    color: BANNER_TEXT,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  triCode: {
    marginTop: -8,
    color: BANNER_TEXT,
    opacity: 0.8,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.sm },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 245, 0.55)',
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(18, 20, 14, 0.45)',
  },
  tabSelected: { borderColor: BANNER_TEXT, backgroundColor: BANNER_TEXT },
  tabText: { color: BANNER_TEXT, fontSize: 12, fontWeight: '700' },
  tabTextSelected: { color: ACTIVE_TAB_TEXT },
});
