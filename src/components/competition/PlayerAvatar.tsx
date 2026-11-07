import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { initials } from '../../core/text/initials';
import { makeStyles } from '../../theme/theme';

type Props = {
  photoUrl?: string | null;
  name: string;
  size?: number;
};

// A photo that is missing, or fails to load, falls back to the athlete's initials.
export const PlayerAvatar = ({ photoUrl, name, size = 36 }: Props) => {
  const styles = useStyles();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl && photoUrl !== failedUrl) {
    return (
      <Image
        accessibilityLabel={`Foto ${name}`}
        source={{ uri: photoUrl }}
        onError={() => setFailedUrl(photoUrl)}
        style={[styles.base, shape]}
      />
    );
  }

  return (
    <View accessibilityLabel={`Iniciais ${name}`} style={[styles.base, styles.placeholder, shape]}>
      <Text style={[styles.initials, { fontSize: Math.max(10, size * 0.34) }]}>{initials(name)}</Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  base: {
    flexShrink: 0,
    backgroundColor: theme.colors.tint,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.olive,
    fontWeight: '900',
  },
}));
