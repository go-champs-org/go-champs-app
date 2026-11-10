import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GameShareCard, GameShareFormat, GameShareMark } from '../../domain/usecases/shared/gameShare';
import { StickerCanvas, StickerLogo, StickerPalette, STICKER_PALETTES } from '../share/StickerParts';

type Props = { card: GameShareCard; format: GameShareFormat; backgroundUri?: string | null };

// A team or tournament: its logo, when it has one, beside the name.
const MarkRow = ({ mark, palette, end, detail }: {
  mark: GameShareMark;
  palette: StickerPalette;
  end: boolean;
  detail?: string;
}) => (
  <View style={[styles.mark, end && styles.markEnd]}>
    {mark.logoUrl ? (
      <Image
        source={{ uri: mark.logoUrl }}
        style={styles.markLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    ) : null}
    <View style={[styles.markText, end && styles.textEnd]}>
      <Text numberOfLines={2} style={[styles.markName, { color: palette.ink }, end && styles.alignEnd]}>
        {mark.name}
      </Text>
      {detail ? <Text style={[styles.markDetail, { color: palette.muted }, end && styles.alignEnd]}>{detail}</Text> : null}
    </View>
  </View>
);

/**
 * Compartilhar jogo: the logo, the athlete, their team, the tournament and the
 * game's stats in the bottom left or the bottom right corner of the story.
 */
export const GameSticker = ({ card, format, backgroundUri }: Props) => {
  const palette = STICKER_PALETTES[format.logo];
  const end = format.layout === 'bottom-right';
  const align = end && styles.alignEnd;
  return (
    <StickerCanvas format={format} backgroundUri={backgroundUri} scrim="bottom">
      <View style={[styles.corner, end ? styles.cornerEnd : styles.cornerStart]}>
        <StickerLogo logo={format.logo} width={104} />
        <Text numberOfLines={2} style={[styles.name, { color: palette.ink }, align]}>
          {card.athleteName}
          {card.shirtNumber ? <Text style={{ color: palette.accent }}>{`  ${card.shirtNumber}`}</Text> : null}
        </Text>
        {card.team ? <MarkRow mark={card.team} palette={palette} end={end} /> : null}
        {card.tournament ? (
          <MarkRow mark={card.tournament} palette={palette} end={end} detail={card.date || undefined} />
        ) : card.date ? (
          <Text style={[styles.markDetail, { color: palette.muted }, align]}>{card.date}</Text>
        ) : null}
        {card.stats.length > 0 ? (
          <View style={styles.stats}>
            {card.stats.map((stat) => (
              <View key={stat.key} style={styles.stat}>
                <Text style={[styles.statValue, { color: palette.ink }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: palette.accent }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </StickerCanvas>
  );
};

const styles = StyleSheet.create({
  corner: {
    flex: 1,
    gap: 10,
    justifyContent: 'flex-end',
  },
  cornerStart: {
    alignItems: 'flex-start',
  },
  cornerEnd: {
    alignItems: 'flex-end',
  },
  alignEnd: {
    textAlign: 'right',
  },
  name: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    maxWidth: 304,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 304,
  },
  markEnd: {
    flexDirection: 'row-reverse',
  },
  markLogo: {
    width: 28,
    height: 28,
  },
  markText: {
    flexShrink: 1,
  },
  textEnd: {
    alignItems: 'flex-end',
  },
  markName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  markDetail: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 6,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
