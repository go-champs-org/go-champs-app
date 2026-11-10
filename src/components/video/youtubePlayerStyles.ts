import { makeStyles } from '../../theme/theme';

export const useYouTubePlayerStyles = makeStyles((theme) => ({
  // Full width of the content, 16:9 like the video.
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  player: {
    flex: 1,
    backgroundColor: '#000000',
  },
}));
