// A game's video as the API stores it: a YouTube video id, though an
// organizer may paste a whole link. Only a clean id ever reaches an embed URL
// or the HTML of the in-app player.

const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

const fromLink = (value: string): string | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  if (host === 'youtu.be') return url.pathname.split('/')[1] || null;
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
  const watched = url.searchParams.get('v');
  if (watched) return watched;
  const [kind, id] = url.pathname.split('/').filter(Boolean);
  return kind === 'embed' || kind === 'live' || kind === 'shorts' ? (id ?? null) : null;
};

export const youtubeVideoId = (code: string | null | undefined): string | null => {
  const value = code?.trim();
  if (!value) return null;
  const id = VIDEO_ID.test(value) ? value : fromLink(value);
  return id && VIDEO_ID.test(id) ? id : null;
};

export const youtubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;

export const youtubeWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;
