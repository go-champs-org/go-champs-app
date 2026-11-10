import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShareFormat, ShareLogo } from '../../domain/usecases/shared/shareFormats';

// A story sticker: the canvas is transparent so the athlete lays it over
// their own photo, or it carries a photo they picked (then it is a flat image).
// It is drawn at 360x640 and saved at 1080x1920.
export const STICKER_WIDTH = 360;
export const STICKER_HEIGHT = 640;
export const STICKER_EXPORT = { width: 1080, height: 1920 };

const LOGOS = {
  dark: require('../../../assets/images/share/logo-dark.png'),
  light: require('../../../assets/images/share/logo-light.png'),
};
const LOGO_RATIO = 587 / 917;

// Brand colors, not theme ones: a sticker looks the same in light and dark mode.
export type StickerPalette = { ink: string; muted: string; accent: string };
export const STICKER_PALETTES: Record<ShareLogo, StickerPalette> = {
  dark: { ink: '#1d1d1b', muted: 'rgba(29, 29, 27, 0.72)', accent: '#1d1d1b' },
  light: { ink: '#ffffff', muted: 'rgba(255, 255, 255, 0.82)', accent: '#d5ff27' },
};

export const StickerLogo = ({ logo, width }: { logo: ShareLogo; width: number }) => (
  <Image
    source={LOGOS[logo]}
    accessibilityIgnoresInvertColors
    style={{ width, height: Math.round(width * LOGO_RATIO) }}
    resizeMode="contain"
  />
);

export const STICKER_CREDIT = 'Fornecido por';

/** A small "Fornecido por <logo>" credit: the brand as a detail, not the headline. */
export const StickerCredit = ({ logo }: { logo: ShareLogo }) => (
  <View style={styles.credit}>
    <Text style={[styles.creditText, { color: STICKER_PALETTES[logo].muted }]}>{STICKER_CREDIT}</Text>
    <StickerLogo logo={logo} width={36} />
  </View>
);

// Over a photo, a shade behind the content keeps it readable: dark under
// white text, light under dark text. Along the bottom for content at the
// bottom, or all over for content in the middle.
export type StickerScrim = 'bottom' | 'full';

const BOTTOM_SCRIMS: Record<ShareLogo, [string, string]> = {
  dark: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.72)'],
  light: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.62)'],
};
const FULL_SCRIMS: Record<ShareLogo, string> = {
  dark: 'rgba(255, 255, 255, 0.5)',
  light: 'rgba(0, 0, 0, 0.45)',
};

const PhotoBackground = ({ uri, logo, scrim }: { uri: string; logo: ShareLogo; scrim: StickerScrim }) => (
  <View style={StyleSheet.absoluteFill} testID="share-sticker-photo">
    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
    {scrim === 'full' ? (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: FULL_SCRIMS[logo] }]} />
    ) : (
      <LinearGradient colors={BOTTOM_SCRIMS[logo]} style={styles.bottomScrim} />
    )}
  </View>
);

type CanvasProps = {
  format: ShareFormat;
  backgroundUri?: string | null;
  scrim: StickerScrim;
  children: React.ReactNode;
};

/** The 360x640 canvas, with the picked photo (and its shade) behind the content. */
export const StickerCanvas = ({ format, backgroundUri, scrim, children }: CanvasProps) => (
  <View style={styles.canvas} testID={`share-sticker-${format.id}`}>
    {backgroundUri ? <PhotoBackground uri={backgroundUri} logo={format.logo} scrim={scrim} /> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  canvas: {
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    backgroundColor: 'transparent',
    padding: 28,
    overflow: 'hidden',
  },
  credit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditText: {
    fontSize: 9,
    fontWeight: '600',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
  },
});
