import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { initials } from '../../core/text/initials';
import { theme } from '../../theme/theme';

type Props = {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
};

// A logo that is missing, or fails to load, falls back to the name's initials.
export const TeamBadge = ({ logoUrl, name, size = 32 }: Props) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (logoUrl && logoUrl !== failedUrl) {
    return (
      <Image
        accessibilityLabel={`Escudo ${name || 'do time'}`}
        source={{ uri: logoUrl }}
        onError={() => setFailedUrl(logoUrl)}
        style={[styles.base, shape]}
      />
    );
  }

  return (
    <View accessibilityLabel={`Iniciais ${name || 'do time'}`} style={[styles.base, styles.placeholder, shape]}>
      <Text style={[styles.initials, { fontSize: Math.max(9, size * 0.3) }]}>{initials(name || 'Time')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
  },
  placeholder: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.success,
    fontWeight: '900',
  },
});
