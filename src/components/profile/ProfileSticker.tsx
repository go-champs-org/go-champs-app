import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ProfileShareCard, ShareFormat, ShareLogo } from '../../domain/usecases/shared/profileShare';

// A story sticker: the canvas is transparent so the athlete lays it over
// their own photo. It is drawn at 360x640 and saved at 1080x1920.
export const STICKER_WIDTH = 360;
export const STICKER_HEIGHT = 640;
export const STICKER_EXPORT = { width: 1080, height: 1920 };

const LOGOS = {
  dark: require('../../../assets/images/share/logo-dark.png'),
  light: require('../../../assets/images/share/logo-light.png'),
};
const LOGO_RATIO = 587 / 917;

// Brand colors, not theme ones: a sticker looks the same in light and dark mode.
type Palette = { ink: string; muted: string; accent: string };
export const STICKER_PALETTES: Record<ShareLogo, Palette> = {
  dark: { ink: '#1d1d1b', muted: 'rgba(29, 29, 27, 0.72)', accent: '#1d1d1b' },
  light: { ink: '#ffffff', muted: 'rgba(255, 255, 255, 0.82)', accent: '#d5ff27' },
};

const LEADER = '·'.repeat(120);

type Props = { card: ProfileShareCard; format: ShareFormat };

const Logo = ({ logo, width }: { logo: ShareLogo; width: number }) => (
  <Image
    source={LOGOS[logo]}
    accessibilityIgnoresInvertColors
    style={{ width, height: Math.round(width * LOGO_RATIO) }}
    resizeMode="contain"
  />
);

const ListRow = ({ label, value, detail, palette }: { label: string; value: string; detail?: string; palette: Palette }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, { color: palette.ink }]}>{label}</Text>
    {/* One unbreakable run of dots, cut by the box instead of ellipsized. */}
    <View style={styles.leaderBox}>
      <Text style={[styles.leader, { color: palette.muted }]}>{LEADER}</Text>
    </View>
    <Text style={[styles.rowValue, { color: palette.ink }]}>
      {value}
      {detail ? <Text style={[styles.rowDetail, { color: palette.muted }]}>{` · ${detail}`}</Text> : null}
    </Text>
  </View>
);

// Stats at the bottom: a compact label … value list under the logo and name.
const BottomSticker = ({ card, palette, logo }: { card: ProfileShareCard; palette: Palette; logo: ShareLogo }) => (
  <View style={styles.bottom}>
    <Logo logo={logo} width={112} />
    <Text numberOfLines={2} style={[styles.bottomName, { color: palette.ink }]}>
      {card.name}
    </Text>
    <Text style={[styles.sport, { color: palette.accent }]}>{card.sport}</Text>
    <View style={styles.rows}>
      <ListRow label="Campeonatos" value={card.tournaments} palette={palette} />
      <ListRow label="Jogos" value={card.games} palette={palette} />
      {card.stats.map((stat) => (
        <ListRow
          key={stat.key}
          label={stat.label}
          value={stat.total}
          detail={`${stat.perGame} por jogo`}
          palette={palette}
        />
      ))}
    </View>
  </View>
);

const BigStat = ({ label, value, caption, palette, accent }: {
  label: string;
  value: string;
  caption?: string;
  palette: Palette;
  accent?: boolean;
}) => (
  <View style={styles.bigStat}>
    <Text style={[styles.bigLabel, { color: palette.muted }]}>{label}</Text>
    <Text style={[styles.bigValue, { color: accent ? palette.accent : palette.ink }]}>{value}</Text>
    {caption ? <Text style={[styles.bigCaption, { color: palette.muted }]}>{caption}</Text> : null}
  </View>
);

// Stats in the middle: big numbers stacked under the logo, like a scoreboard.
const CenterSticker = ({ card, palette, logo }: { card: ProfileShareCard; palette: Palette; logo: ShareLogo }) => (
  <View style={styles.center}>
    <Logo logo={logo} width={120} />
    <Text numberOfLines={2} style={[styles.centerName, { color: palette.ink }]}>
      {card.name}
    </Text>
    <Text style={[styles.sport, { color: palette.accent }]}>{card.sport}</Text>
    <View style={styles.pair}>
      <BigStat label="Campeonatos" value={card.tournaments} palette={palette} />
      <BigStat label="Jogos" value={card.games} palette={palette} />
    </View>
    {card.stats.map((stat) => (
      <BigStat
        key={stat.key}
        label={stat.perGameLabel}
        value={stat.perGame}
        caption={stat.totalCaption}
        palette={palette}
        accent
      />
    ))}
  </View>
);

export const ProfileSticker = ({ card, format }: Props) => {
  const palette = STICKER_PALETTES[format.logo];
  return (
    <View style={styles.canvas} testID={`share-sticker-${format.id}`}>
      {format.layout === 'bottom' ? (
        <BottomSticker card={card} palette={palette} logo={format.logo} />
      ) : (
        <CenterSticker card={card} palette={palette} logo={format.logo} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    backgroundColor: 'transparent',
    padding: 28,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomName: {
    marginTop: 14,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  sport: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
  },
  rows: {
    marginTop: 12,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  leaderBox: {
    flex: 1,
    height: 16,
    overflow: 'hidden',
  },
  leader: {
    width: 1000,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowDetail: {
    fontSize: 12,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerName: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  pair: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 6,
  },
  bigStat: {
    alignItems: 'center',
  },
  bigLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bigValue: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
  },
  bigCaption: {
    fontSize: 11,
    fontWeight: '500',
  },
});
