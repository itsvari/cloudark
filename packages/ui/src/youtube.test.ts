import { describe, expect, it } from 'vitest';
import { youtubeVideoId } from './youtube';

describe('youtubeVideoId', () => {
  it.each([
    'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    'https://youtu.be/jfKfPfyJRdk?t=10',
    'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk',
    'https://youtube.com/shorts/jfKfPfyJRdk',
    'https://www.youtube.com/live/jfKfPfyJRdk',
    'jfKfPfyJRdk',
  ])('extracts a video identifier from %s', (value) => {
    expect(youtubeVideoId(value)).toBe('jfKfPfyJRdk');
  });

  it.each([
    'https://youtube.com.evil.example/watch?v=jfKfPfyJRdk',
    'https://example.com/embed/jfKfPfyJRdk',
    'javascript:alert(1)',
    'http://youtube.com/watch?v=jfKfPfyJRdk',
    'https://www.youtube.com/watch?v=invalid',
    'https://www.youtube.com/channel/jfKfPfyJRdk',
    '',
  ])('rejects an unsupported source %s', (value) => {
    expect(youtubeVideoId(value)).toBeUndefined();
  });
});
