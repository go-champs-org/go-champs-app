import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileShareCard, ProfileShareFormat } from '../../domain/usecases/shared/profileShare';
import { ShareLogo } from '../../domain/usecases/shared/shareFormats';
import { StickerCanvas, StickerCredit, StickerLogo, StickerPalette, STICKER_PALETTES } from '../share/StickerParts';

type Palette = StickerPalette;

const LEADER = '·'.repeat(120);

type Props = { card: ProfileShareCard; format: ProfileShareFormat; backgroundUri?: string | null };

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

// Stats at the bottom: a compact label … value list under the name, with a
// small "Fornecido por" credit as the last line.
const BottomSticker = ({ card, palette, logo }: { card: ProfileShareCard; palette: Palette; logo: ShareLogo }) => (
  <View style={styles.bottom}>
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
    <View style={styles.credit}>
      <StickerCredit logo={logo} />
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
    <StickerLogo logo={logo} width={120} />
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

export const ProfileSticker = ({ card, format, backgroundUri }: Props) => {
  const palette = STICKER_PALETTES[format.logo];
  return (
    <StickerCanvas format={format} backgroundUri={backgroundUri} scrim={format.layout === 'bottom' ? 'bottom' : 'full'}>
      {format.layout === 'bottom' ? (
        <BottomSticker card={card} palette={palette} logo={format.logo} />
      ) : (
        <CenterSticker card={card} palette={palette} logo={format.logo} />
      )}
    </StickerCanvas>
  );
};

const styles = StyleSheet.create({
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  credit: {
    marginTop: 14,
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
