import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost } from './analyze.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) =>
  JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));

describe('extractCitations', () => {
  it('reads the generateContent shape', () => {
    const response = {
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://mi-code.pl/', title: 'MiCode', domain: 'mi-code.pl' } },
              { web: { uri: 'https://wfirma.pl/', title: 'wFirma' } },
            ],
          },
        },
      ],
    };
    expect(extractCitations(response)).toEqual([
      { url: 'https://mi-code.pl/', title: 'MiCode', domain: 'mi-code.pl' },
      { url: 'https://wfirma.pl/', title: 'wFirma', domain: null },
    ]);
  });

  it('reads the interactions url_citation shape', () => {
    const response = {
      steps: [
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              annotations: [
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'MiCode' },
                { type: 'something_else', url: 'https://ignored.example/' },
              ],
            },
          ],
        },
      ],
    };
    expect(extractCitations(response)).toEqual([
      { url: 'https://mi-code.pl/', title: 'MiCode', domain: null },
    ]);
  });

  it('handles both committed fixtures without throwing', () => {
    for (const name of ['generate-content.json', 'interactions.json']) {
      expect(Array.isArray(extractCitations(fixture(name)))).toBe(true);
    }
  });

  it('de-duplicates a url cited more than once', () => {
    const response = {
      steps: [
        {
          content: [
            {
              annotations: [
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'a' },
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'b' },
              ],
            },
          ],
        },
      ],
    };
    expect(extractCitations(response)).toHaveLength(1);
  });

  it('returns an empty list for an ungrounded answer', () => {
    expect(extractCitations({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] })).toEqual([]);
    expect(extractCitations({})).toEqual([]);
  });
});

describe('extractText', () => {
  it('reads output_text when present', () => {
    expect(extractText({ output_text: 'answer' })).toBe('answer');
  });

  it('joins candidate parts otherwise', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: 'one' }, { text: 'two' }] } }],
    };
    expect(extractText(response)).toBe('one\ntwo');
  });

  it('returns an empty string when there is no text at all', () => {
    expect(extractText({})).toBe('');
  });
});

describe('resolveHost', () => {
  const explode = () => {
    throw new Error('network must not be touched for a direct url');
  };

  it('takes the host straight off a direct url and drops www', async () => {
    expect(await resolveHost({ url: 'https://www.mi-code.pl/en/' }, explode)).toBe('mi-code.pl');
  });

  it('prefers the domain field over a network call for a redirect', async () => {
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      domain: 'www.mi-code.pl',
    };
    expect(await resolveHost(citation, explode)).toBe('mi-code.pl');
  });

  it('reads the publisher domain off the title when it is shaped like one', async () => {
    // Confirmed against the live fixture on 2026-08-11: grounded chunks carry no
    // domain field, and their title is the bare publisher domain.
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: 'krs-online.com.pl',
      domain: null,
    };
    expect(await resolveHost(citation, explode)).toBe('krs-online.com.pl');
  });

  it('follows the redirect when the title is a page title rather than a domain', async () => {
    const fetchImpl = async () => ({ url: 'https://mi-code.pl/products/accounting-ai/' });
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: 'MiCode — enterprise software and AI',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('mi-code.pl');
  });

  it('follows the redirect when there is no title at all', async () => {
    const fetchImpl = async () => ({ url: 'https://mi-code.pl/products/accounting-ai/' });
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: '',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('mi-code.pl');
  });

  it('reports unknown instead of throwing when the redirect cannot be followed', async () => {
    const fetchImpl = async () => {
      throw new Error('ECONNRESET');
    };
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('unknown');
  });

  it('reports unknown for a malformed url', async () => {
    expect(await resolveHost({ url: 'not a url' }, explode)).toBe('unknown');
  });
});
