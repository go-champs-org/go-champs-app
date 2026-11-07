import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { initials } from '../../core/text/initials';
import { makeStyles } from '../../theme/theme';

type Props = {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
};

// A logo keeps its own shape, fitted inside a square like the public site;
// one that is missing, or fails to load, falls back to the name's initials in
// a circle.
export const TeamBadge = ({ logoUrl, name, size = 32 }: Props) => {
  const styles = useStyles();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const box = { width: size, height: size };

  if (logoUrl && logoUrl !== failedUrl) {
    return (
      <Image
        accessibilityLabel={`Escudo ${name || 'do time'}`}
        source={{ uri: logoUrl }}
        onError={() => setFailedUrl(logoUrl)}
        resizeMode="contain"
        style={[styles.base, box]}
      />
    );
  }

  return (
    <View accessibilityLabel={`Iniciais ${name || 'do time'}`} style={[styles.base, styles.placeholder, box, { borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.max(9, size * 0.3) }]}>{initials(name || 'Time')}</Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
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
}));
