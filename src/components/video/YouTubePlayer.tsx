import React from 'react';
import { Linking, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { youtubeEmbedUrl } from '../../domain/usecases/shared/youtube';
import { useYouTubePlayerStyles } from './youtubePlayerStyles';

// YouTube refuses to play an embed without a referring page, so the player is
// an iframe inside a page served as go-champs.com.
const PAGE_ORIGIN = 'https://go-champs.com';

const playerHtml = (videoId: string) => `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{display:block;border:0;width:100%;height:100%}</style>
</head><body>
<iframe src="${youtubeEmbedUrl(videoId)}" title="Vídeo do jogo"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"></iframe>
</body></html>`;

type Props = { videoId: string };

/** The game's YouTube video, played inline. */
export const YouTubePlayer = ({ videoId }: Props) => {
  const styles = useYouTubePlayerStyles();

  // The player stays inside its frame; a tap that would leave it (the YouTube
  // logo, a suggested video) opens YouTube instead.
  const keepInPlayer = (request: WebViewNavigation & { isTopFrame?: boolean }) => {
    if (request.isTopFrame === false || request.url.startsWith(PAGE_ORIGIN) || request.url === 'about:blank') {
      return true;
    }
    void Linking.openURL(request.url);
    return false;
  };

  return (
    <View accessibilityLabel="Vídeo do jogo" style={styles.frame} testID="game-video">
      <WebView
        source={{ html: playerHtml(videoId), baseUrl: PAGE_ORIGIN }}
        style={styles.player}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        onShouldStartLoadWithRequest={keepInPlayer}
      />
    </View>
  );
};
