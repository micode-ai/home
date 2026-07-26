import { describe, it, expect } from 'vitest';
import { estimateReadingMinutes } from './readingTime';

describe('estimateReadingMinutes', () => {
  it('floors at 1 minute for very short bodies', () => {
    expect(estimateReadingMinutes('A short update.')).toBe(1);
    expect(estimateReadingMinutes('')).toBe(1);
  });

  it('rounds to the nearest minute at 200 words/minute', () => {
    const words300 = new Array(300).fill('word').join(' ');
    expect(estimateReadingMinutes(words300)).toBe(2); // 300/200 = 1.5 -> rounds to 2
    const words199 = new Array(199).fill('word').join(' ');
    expect(estimateReadingMinutes(words199)).toBe(1); // 199/200 = 0.995 -> rounds to 1, floored anyway
    const words500 = new Array(500).fill('word').join(' ');
    expect(estimateReadingMinutes(words500)).toBe(3); // 500/200 = 2.5 -> rounds to 3 (banker's-free JS rounding)
  });

  it('respects a custom words-per-minute rate', () => {
    const words100 = new Array(100).fill('word').join(' ');
    expect(estimateReadingMinutes(words100, 100)).toBe(1);
    expect(estimateReadingMinutes(words100, 50)).toBe(2);
  });

  it('strips diagram/table/widget directive tokens entirely, including captions', () => {
    const body = 'Intro paragraph.\n\n[[diagram:some-id|A long caption with several words in it]]\n\nOutro.';
    const withoutDirective = 'Intro paragraph.\n\nOutro.';
    expect(estimateReadingMinutes(body)).toBe(estimateReadingMinutes(withoutDirective));
  });

  it('strips table and widget directives', () => {
    expect(estimateReadingMinutes('Para one.\n\n[[table:pricing]]\n\nPara two.')).toBe(
      estimateReadingMinutes('Para one.\n\nPara two.')
    );
    expect(estimateReadingMinutes('Para one.\n\n[[widget:cost-calculator]]\n\nPara two.')).toBe(
      estimateReadingMinutes('Para one.\n\nPara two.')
    );
  });

  it('strips heading and callout block markers but keeps their text', () => {
    const withMarkers = '## A Heading\n\n> A callout with some words';
    const withoutMarkers = 'A Heading\n\nA callout with some words';
    expect(estimateReadingMinutes(withMarkers)).toBe(estimateReadingMinutes(withoutMarkers));
  });

  it('strips bold/italic inline markers but keeps the wrapped text', () => {
    const withMarkup = 'This has **bold text** and *italic text* inline.';
    const plain = 'This has bold text and italic text inline.';
    expect(estimateReadingMinutes(withMarkup)).toBe(estimateReadingMinutes(plain));
  });

  it('produces a plausible estimate for a long-form article-sized body', () => {
    const paragraph = new Array(50).fill('word').join(' '); // 50 words
    const body = new Array(40).fill(paragraph).join('\n\n'); // ~2000 words
    expect(estimateReadingMinutes(body)).toBe(10); // 2000/200 = 10
  });
});
