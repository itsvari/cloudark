export interface ArticleHeading {
  readonly depth: number;
  readonly slug: string;
  readonly text: string;
}

export interface ContentsHeading extends ArticleHeading {
  readonly number: string;
}

interface NumberingState {
  readonly section: number;
  readonly subsection: number;
  readonly headings: readonly ContentsHeading[];
}

export function numberArticleHeadings(headings: readonly ArticleHeading[]): readonly ContentsHeading[] {
  return headings.reduce<NumberingState>((previous, heading) => {
    if (heading.depth !== 2 && heading.depth !== 3) return previous;
    const section = heading.depth === 2 ? previous.section + 1 : previous.section || 1;
    const subsection = heading.depth === 3 ? previous.subsection + 1 : 0;
    const number = `${String(section).padStart(2, '0')}${subsection ? `.${subsection}` : ''}`;
    return { section, subsection, headings: [...previous.headings, { ...heading, number }] };
  }, { section: 0, subsection: 0, headings: [] }).headings;
}

export interface HeadingPosition {
  readonly slug: string;
  readonly topPx: number;
}

interface ReadingPosition {
  readonly headings: readonly HeadingPosition[];
  readonly scrollTopPx: number;
  readonly viewportHeightPx: number;
  readonly documentHeightPx: number;
  readonly activationOffsetPx: number;
}

const scrollTolerancePx = 4;

export function activeArticleHeading({ headings, scrollTopPx, viewportHeightPx, documentHeightPx, activationOffsetPx }: ReadingPosition): string | undefined {
  if (scrollTopPx > 0 && scrollTopPx + viewportHeightPx >= documentHeightPx - scrollTolerancePx) return headings.at(-1)?.slug;
  const activationPositionPx = scrollTopPx + activationOffsetPx + scrollTolerancePx;
  return headings.reduce<string | undefined>((active, heading) => heading.topPx <= activationPositionPx ? heading.slug : active, headings[0]?.slug);
}
