import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';

// The same red the public site and the CMS use for live; only the dot carries
// it, the label stays in the text color for contrast.
export const LIVE_RED = '#ff4136';

// The public site's `animate-pulse`: the dot fades to half and back every 2s.
const PULSE_HALF_MS = 1000;
const PULSE_EASING = Easing.bezier(0.4, 0, 0.6, 1);

export const LiveBadge = () => {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: PULSE_HALF_MS, easing: PULSE_EASING, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: PULSE_HALF_MS, easing: PULSE_EASING, useNativeDriver }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View accessibilityLabel="Ao vivo" style={styles.live}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>AO VIVO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: LIVE_RED },
  liveText: { color: theme.colors.ink, fontSize: 12, fontWeight: '800' },
});
