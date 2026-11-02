const videoIdentifier = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
const videoPaths = new Set(['embed', 'shorts', 'live']);

function validIdentifier(candidate: string | null | undefined): string | undefined {
  return candidate && videoIdentifier.test(candidate) ? candidate : undefined;
}

export function youtubeVideoId(value: string): string | undefined {
  if (videoIdentifier.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:') return undefined;
  const segments = url.pathname.split('/').filter(Boolean);
  if (url.hostname === 'youtu.be') return validIdentifier(segments[0]);
  if (!youtubeHosts.has(url.hostname)) return undefined;
  if (url.pathname === '/watch') return validIdentifier(url.searchParams.get('v'));
  if (videoPaths.has(segments[0] ?? '')) return validIdentifier(segments[1]);
  return undefined;
}
