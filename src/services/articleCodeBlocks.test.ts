import { describe, it, expect } from 'vitest';
import { splitArticleChunks, parseCodeFence } from './articleCodeBlocks';

describe('splitArticleChunks', () => {
  it('splits plain paragraphs on blank lines', () => {
    expect(splitArticleChunks('a\n\nb\nc\n\nd')).toEqual(['a', 'b\nc', 'd']);
  });

  it('keeps a fenced block with blank lines as one chunk', () => {
    expect(splitArticleChunks('a\n\n```js\nx\n\ny\n```\n\nb')).toEqual(['a', '```js\nx\n\ny\n```', 'b']);
  });

  it('runs an unclosed fence to the end', () => {
    expect(splitArticleChunks('```\nx\n\ny')).toEqual(['```\nx\n\ny']);
  });
});

describe('parseCodeFence', () => {
  it('returns lang and code', () => {
    expect(parseCodeFence('```ts\nconst a = 1;\n```')).toEqual({ lang: 'ts', code: 'const a = 1;' });
  });
  it('allows a missing language and unclosed fence', () => {
    expect(parseCodeFence('```\nx')).toEqual({ lang: '', code: 'x' });
  });
  it('returns null for non-fences', () => {
    expect(parseCodeFence('plain')).toBeNull();
  });
});
