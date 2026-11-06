import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles } from '../../theme/theme';

// The public profile banner's green (packages/ui ProfileBanner): a 115° sweep
// whose last stop sits past the edge, so the card ends on the mix it reaches
// there. Literal colors: the banner stays green whatever the theme.
const BANNER_COLORS = ['#2f4419', '#4d6b2c', '#68873d'] as const;
const BANNER_LOCATIONS = [0, 0.55, 1] as const;

export const BANNER_TEXT = '#f5f5f5';
export const BANNER_ACCENT = '#4d6b2c';

type Props = { children: React.ReactNode; testID?: string };

// The green card a team or an athlete page opens with.
export const ProfileBanner = ({ children, testID }: Props) => {
  const styles = useStyles();
  return (
    <LinearGradient
      colors={BANNER_COLORS}
      locations={BANNER_LOCATIONS}
      start={{ x: 0, y: 0.29 }}
      end={{ x: 1, y: 0.71 }}
      style={styles.banner}
      testID={testID}
    >
      {children}
    </LinearGradient>
  );
};

const useStyles = makeStyles((theme) => ({
  banner: {
    overflow: 'hidden',
    padding: 20,
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
}));
