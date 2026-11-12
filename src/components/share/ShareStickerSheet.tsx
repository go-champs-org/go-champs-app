import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { ShareFormat } from '../../domain/usecases/shared/shareFormats';
import type { ShareAction, ShareStickerModel, StickerCapture } from '../../viewmodels/ShareStickerViewModel';
import { makeStyles, tokens, useTheme } from '../../theme/theme';
import { STICKER_EXPORT, STICKER_HEIGHT, STICKER_WIDTH } from './StickerParts';

const CHECKERS = {
  // Dark stickers sit on a light checkerboard, light ones on a dark one.
  dark: require('../../../assets/images/share/checker-light.png'),
  light: require('../../../assets/images/share/checker-dark.png'),
};

const SHEET_MAX_WIDTH = 560;
const SHEET_GUTTER = 20;
const TILE_GAP = 12;

const ACTIONS: { action: ShareAction; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { action: 'copy', label: 'Copiar', icon: 'copy-outline' },
  { action: 'save', label: 'Salvar', icon: 'download-outline' },
  { action: 'share', label: 'Compartilhar', icon: 'share-outline' },
];

/** Draws one format of the sticker at full size (360x640). */
export type RenderSticker<Payload, Format extends ShareFormat> = (
  payload: Payload,
  format: Format,
  backgroundUri: string | null
) => React.ReactNode;

type Props<Payload, Format extends ShareFormat> = {
  model: ShareStickerModel<Payload, Format>;
  // 'Compartilhar perfil'
  title: string;
  testID: string;
  renderSticker: RenderSticker<Payload, Format>;
};

// One format in the grid: the sticker scaled down over a checkerboard, which
// stands for the transparent background.
const FormatTile = ({ sticker, format, selected, width, onPress, disabled }: {
  sticker: React.ReactNode;
  format: ShareFormat;
  selected: boolean;
  width: number;
  onPress: () => void;
  disabled: boolean;
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const scale = width / STICKER_WIDTH;
  const height = Math.round(STICKER_HEIGHT * scale);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={format.description}
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={[styles.tile, { width }]}
      testID={`share-format-${format.id}`}
    >
      <View style={[styles.tileFrame, selected && styles.tileFrameSelected]}>
        <View style={{ width, height }}>
          <Image source={CHECKERS[format.logo]} resizeMode="repeat" style={styles.checker} />
          {/* Scaled around its center, then moved so it fills the tile. */}
          <View
            style={{
              width: STICKER_WIDTH,
              height: STICKER_HEIGHT,
              transform: [
                { translateX: (width - STICKER_WIDTH) / 2 },
                { translateY: (height - STICKER_HEIGHT) / 2 },
                { scale },
              ],
            }}
          >
            {sticker}
          </View>
        </View>
        {selected ? (
          <View style={styles.tileCheck}>
            <Ionicons name="checkmark" size={16} color={theme.colors.onAccent} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>{format.label}</Text>
    </Pressable>
  );
};

/**
 * A story sticker's formats (Compartilhar perfil, Compartilhar jogo), an
 * optional photo behind it and what to do with the chosen one.
 */
export const ShareStickerSheet = <Payload, Format extends ShareFormat>({
  model,
  title,
  testID,
  renderSticker,
}: Props<Payload, Format>) => {
  const payload = model.payload;
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const stickerRef = useRef<React.ComponentRef<typeof View>>(null);

  const sheetWidth = Math.min(windowWidth, SHEET_MAX_WIDTH);
  const tileWidth = Math.floor((sheetWidth - SHEET_GUTTER * 2 - TILE_GAP) / 2);

  // Transparent stickers stay PNG; over a photo the image is opaque, and a
  // JPEG is a fraction of the size.
  const imageFormat = model.backgroundUri
    ? ({ format: 'jpg', quality: 0.9 } as const)
    : ({ format: 'png', quality: 1 } as const);
  const capture: StickerCapture = {
    toFile: () => captureRef(stickerRef, { ...STICKER_EXPORT, ...imageFormat, result: 'tmpfile' }),
    toBase64: () => captureRef(stickerRef, { ...STICKER_EXPORT, ...imageFormat, result: 'base64' }),
  };

  // The whole photo, cropped to the story by the sticker (iOS can only crop
  // the picker to a square).
  const pickBackground = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (asset) model.selectBackground(asset.uri);
  };

  return (
    <Modal
      visible={model.visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={model.close}
    >
      {payload !== null ? (
        <View style={styles.root} testID={testID}>
          {/* The full-size sticker that gets saved. It sits under the opaque
              cover: the capture draws the view itself, not what is over it. */}
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
            style={styles.captureHost}
          >
            <View ref={stickerRef} collapsable={false} testID="share-capture">
              {renderSticker(payload, model.format, model.backgroundUri)}
            </View>
          </View>

          <View style={styles.cover}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  onPress={model.close}
                  hitSlop={8}
                  style={styles.close}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                <View style={styles.close} />
              </View>

              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>
                  {model.backgroundUri
                    ? 'Escolha um formato. A imagem sai com a sua foto de fundo.'
                    : 'Escolha um formato. O fundo é transparente para você usar sobre suas fotos e stories, ou escolha uma foto de fundo.'}
                </Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={model.backgroundUri ? 'Trocar foto de fundo' : 'Escolher foto de fundo'}
                    disabled={model.busy !== null}
                    onPress={() => void pickBackground()}
                    style={[styles.photoButton, styles.photoButtonMain]}
                  >
                    <Ionicons name="image-outline" size={18} color={theme.colors.onAccent} />
                    <Text style={styles.photoButtonMainText}>
                      {model.backgroundUri ? 'Trocar foto de fundo' : 'Escolher foto de fundo'}
                    </Text>
                  </TouchableOpacity>
                  {model.backgroundUri ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Remover foto de fundo"
                      disabled={model.busy !== null}
                      onPress={() => model.selectBackground(null)}
                      style={[styles.photoButton, styles.photoButtonSecondary]}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.textPrimary} />
                      <Text style={styles.photoButtonSecondaryText}>Remover</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View accessibilityRole="radiogroup" accessibilityLabel="Formato" style={styles.grid}>
                  {model.formats.map((format) => (
                    <FormatTile
                      key={format.id}
                      sticker={renderSticker(payload, format, model.backgroundUri)}
                      format={format}
                      width={tileWidth}
                      selected={format.id === model.format.id}
                      onPress={() => model.select(format.id)}
                      disabled={model.busy !== null}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, tokens.spacing.md) }]}>
                {model.error ? (
                  <View accessibilityRole="alert" style={styles.error}>
                    <Ionicons name="alert-circle" size={18} color={theme.colors.onDangerSoft} />
                    <Text style={styles.errorText}>{model.error}</Text>
                  </View>
                ) : null}
                {model.notice ? (
                  <View accessibilityLiveRegion="polite" style={styles.notice}>
                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                    <Text style={styles.noticeText}>{model.notice}</Text>
                  </View>
                ) : null}
                {model.actionsAvailable ? (
                  <View style={styles.actions}>
                    {ACTIONS.map(({ action, label, icon }) => (
                      <TouchableOpacity
                        key={action}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        aria-disabled={model.busy !== null}
                        aria-busy={model.busy === action}
                        disabled={model.busy !== null}
                        onPress={() => void model.run(action, capture)}
                        style={styles.action}
                      >
                        <View style={styles.actionIcon}>
                          {model.busy === action ? (
                            <ActivityIndicator color={theme.colors.textPrimary} />
                          ) : (
                            <Ionicons name={icon} size={24} color={theme.colors.textPrimary} />
                          )}
                        </View>
                        <Text style={styles.actionLabel}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.webHint}>
                    Para copiar, salvar ou compartilhar a imagem, use o app Go Champs.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  captureHost: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Full width and opaque, over the capture copy (the sheet itself is narrower on tablets and web).
  cover: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  sheet: {
    flex: 1,
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: theme.spacing.sm,
  },
  close: {
    width: theme.layout.touchTarget,
    height: theme.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: SHEET_GUTTER,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  intro: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  photoButtonMain: {
    flex: 1,
    backgroundColor: theme.colors.accent,
  },
  photoButtonMainText: {
    color: theme.colors.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  photoButtonSecondary: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  photoButtonSecondaryText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tile: {
    gap: 6,
  },
  tileFrame: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  tileFrameSelected: {
    borderColor: theme.colors.accent,
  },
  checker: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  tileLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  tileLabelSelected: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: SHEET_GUTTER,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.subtleBorder,
    backgroundColor: theme.colors.background,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSoft,
  },
  errorText: {
    flex: 1,
    color: theme.colors.onDangerSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
  },
  noticeText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: {
    alignItems: 'center',
    gap: 6,
    minWidth: 88,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  actionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  webHint: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
}));
