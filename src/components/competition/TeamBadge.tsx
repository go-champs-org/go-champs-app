import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';

type Props = {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
};

const initials = (name?: string | null) =>
  (name || 'Time')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

export const TeamBadge = ({ logoUrl, name, size = 32 }: Props) => {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (logoUrl) {
    return <Image accessibilityLabel={`Escudo ${name || 'do time'}`} source={{ uri: logoUrl }} style={[styles.base, shape]} />;
  }

  return (
    <View accessibilityLabel={`Iniciais ${name || 'do time'}`} style={[styles.base, styles.placeholder, shape]}>
      <Text style={[styles.initials, { fontSize: Math.max(9, size * 0.3) }]}>{initials(name)}</Text>
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
