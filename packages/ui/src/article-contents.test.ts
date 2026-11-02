import { describe, expect, it } from 'vitest';
import { activeArticleHeading, numberArticleHeadings } from './article-contents';

describe('article contents numbering', () => {
  it('numbers sections and nested headings while ignoring other depths', () => {
    expect(numberArticleHeadings([
      { depth: 1, slug: 'title', text: 'Title' },
      { depth: 2, slug: 'one', text: 'One' },
      { depth: 3, slug: 'nested', text: 'Nested' },
      { depth: 4, slug: 'ignored', text: 'Ignored' },
      { depth: 3, slug: 'nested-again', text: 'Nested again' },
      { depth: 2, slug: 'two', text: 'Two' },
    ]).map(({ slug, number }) => ({ slug, number }))).toEqual([
      { slug: 'one', number: '01' },
      { slug: 'nested', number: '01.1' },
      { slug: 'nested-again', number: '01.2' },
      { slug: 'two', number: '02' },
    ]);
  });
});

describe('active article section', () => {
  const headings = [{ slug: 'one', topPx: 400 }, { slug: 'two', topPx: 1000 }, { slug: 'three', topPx: 1800 }];
  const position = { headings, scrollTopPx: 0, viewportHeightPx: 800, documentHeightPx: 2300, activationOffsetPx: 96 };

  it('starts on the first section before the first heading', () => {
    expect(activeArticleHeading(position)).toBe('one');
  });

  it('tracks the heading crossing the anchor offset, including a small scroll tolerance', () => {
    expect(activeArticleHeading({ ...position, scrollTopPx: 890 })).toBe('one');
    expect(activeArticleHeading({ ...position, scrollTopPx: 900 })).toBe('two');
  });

  it('returns to the earlier section when scrolling backwards', () => {
    expect(activeArticleHeading({ ...position, scrollTopPx: 1100 })).toBe('two');
    expect(activeArticleHeading({ ...position, scrollTopPx: 850 })).toBe('one');
  });

  it('activates a short last section at the page bottom even if its heading cannot reach the offset', () => {
    expect(activeArticleHeading({ ...position, scrollTopPx: 1500 })).toBe('three');
  });

  it('handles a viewport resize that exposes the final section', () => {
    expect(activeArticleHeading({ ...position, scrollTopPx: 1300 })).toBe('two');
    expect(activeArticleHeading({ ...position, scrollTopPx: 1300, viewportHeightPx: 1000 })).toBe('three');
  });

  it('handles a hash or history jump into a later section', () => {
    expect(activeArticleHeading({ ...position, scrollTopPx: 1704, documentHeightPx: 3000 })).toBe('three');
  });

  it('has no active section when there are no headings', () => {
    expect(activeArticleHeading({ ...position, headings: [] })).toBeUndefined();
  });
});
