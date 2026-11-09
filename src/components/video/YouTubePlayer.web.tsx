import React from 'react';
import { View } from 'react-native';
import { youtubeEmbedUrl } from '../../domain/usecases/shared/youtube';
import { useYouTubePlayerStyles } from './youtubePlayerStyles';

type Props = { videoId: string };

/** The game's YouTube video, played inline (web: a plain iframe). */
export const YouTubePlayer = ({ videoId }: Props) => {
  const styles = useYouTubePlayerStyles();
  return (
    <View style={styles.frame} testID="game-video">
      {React.createElement('iframe', {
        src: youtubeEmbedUrl(videoId),
        title: 'Vídeo do jogo',
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowFullScreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        style: { display: 'block', border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
};
