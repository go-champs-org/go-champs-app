import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theme } from '../../theme/theme';

// The green strip with the court pattern that tops a tournament or an
// organization card (the public pages' ProfileBanner strip).
export const CardBanner = () => (
  <View style={styles.banner}>
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      source={require('../../../assets/images/tournament-banner-pattern.png')}
      style={styles.pattern}
    />
  </View>
);

const styles = StyleSheet.create({
  banner: {
    height: 44,
    overflow: 'hidden',
    backgroundColor: theme.colors.bannerEnd,
  },
  pattern: {
    position: 'absolute',
    top: -180,
    left: -60,
    width: 240,
    height: 400,
    opacity: 0.3,
    transform: [{ rotate: '-118.5deg' }],
  },
});
