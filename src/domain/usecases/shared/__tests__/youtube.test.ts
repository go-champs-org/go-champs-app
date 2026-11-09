import { youtubeEmbedUrl, youtubeVideoId } from '../youtube';

describe('youtubeVideoId', () => {
  it('keeps a plain video id', () => {
    expect(youtubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('  dQw4w9WgXcQ ')).toBe('dQw4w9WgXcQ');
  });

  it('reads the id out of a pasted YouTube link', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://www.youtube-nocookie.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('has no video without a usable id', () => {
    expect(youtubeVideoId(null)).toBeNull();
    expect(youtubeVideoId(undefined)).toBeNull();
    expect(youtubeVideoId('   ')).toBeNull();
    expect(youtubeVideoId('"><script>alert(1)</script>')).toBeNull();
    expect(youtubeVideoId('https://vimeo.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/@GoChampsApp')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/channel')).toBeNull();
    expect(youtubeVideoId('https://youtu.be/')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/embed/')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/watch?v=bad"id')).toBeNull();
  });
});

describe('YouTube URLs', () => {
  it('builds the inline player URL', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0');
  });
});
