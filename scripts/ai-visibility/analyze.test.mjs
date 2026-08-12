import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost, classify, bestStatus, summarize, ownedHosts } from './analyze.mjs';

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

  it('pulls the real sources out of each committed fixture', () => {
    // Asserting only that an array comes back would still pass if parsing
    // silently regressed to [] for both shapes — which is the one failure this
    // test exists to catch.
    const live = extractCitations(fixture('generate-content.json'));
    expect(live).toHaveLength(6);
    expect(live.every((c) => c.url.includes('vertexaisearch.cloud.google.com'))).toBe(true);
    expect(live.map((c) => c.title)).toContain('eksiegowyai.pl');

    const annotated = extractCitations(fixture('interactions.json'));
    expect(annotated).toHaveLength(2);
    expect(annotated[0].url).toBe('https://mi-code.pl/');
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
    // First occurrence wins — pinned so the dedup rule cannot quietly invert.
    expect(extractCitations(response)).toEqual([
      { url: 'https://mi-code.pl/', title: 'a', domain: null },
    ]);
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

const BRAND = ['MiCode', 'eKsiegowyAi'];

describe('classify', () => {
  it('calls it cited when our domain is among the sources', () => {
    const status = classify({
      text: 'Nothing recognisable here.',
      hosts: ['wfirma.pl', 'mi-code.pl'],
      domain: 'mi-code.pl',
      brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('counts a subdomain of ours as cited', () => {
    const status = classify({
      text: '', hosts: ['blog.mi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('does not mistake a lookalike domain for ours', () => {
    const status = classify({
      text: '', hosts: ['notmi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('absent');
  });

  it('calls it mentioned when the brand is in the text but not in the sources', () => {
    const status = classify({
      text: 'Takim narzedziem jest eKsiegowyAi od polskiego zespolu.',
      hosts: ['poradnikprzedsiebiorcy.pl'],
      domain: 'mi-code.pl',
      brandTerms: BRAND,
    });
    expect(status).toBe('mentioned');
  });

  it('matches a brand term regardless of case', () => {
    const status = classify({
      text: 'micode builds agents', hosts: [], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('mentioned');
  });

  it('prefers cited over mentioned when both are true', () => {
    const status = classify({
      text: 'MiCode', hosts: ['mi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('calls it absent when neither is true', () => {
    const status = classify({
      text: 'Some other vendors.', hosts: ['sap.com'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('absent');
  });
});

describe('bestStatus', () => {
  it('takes the strongest of the repeats', () => {
    expect(bestStatus(['absent', 'cited'])).toBe('cited');
    expect(bestStatus(['absent', 'mentioned'])).toBe('mentioned');
    expect(bestStatus(['absent', 'absent'])).toBe('absent');
  });

  it('treats no attempts as absent rather than crashing', () => {
    expect(bestStatus([])).toBe('absent');
  });
});

const OWNED = ['mi-code.pl', 'eksiegowyai.pl', 'ai-budget.pl'];

describe('ownedHosts', () => {
  it('picks out the hosts that are ours and drops the rest', () => {
    expect(ownedHosts(['wfirma.pl', 'eksiegowyai.pl', 'sap.com'], OWNED))
      .toEqual(['eksiegowyai.pl']);
  });

  it('counts a subdomain of an owned property', () => {
    expect(ownedHosts(['blog.ai-budget.pl'], OWNED)).toEqual(['blog.ai-budget.pl']);
  });

  it('does not fall for a lookalike of an owned property', () => {
    expect(ownedHosts(['noteksiegowyai.pl'], OWNED)).toEqual([]);
  });

  it('returns nothing when no host is ours', () => {
    expect(ownedHosts(['gowork.pl'], OWNED)).toEqual([]);
  });
});

describe('classify across the portfolio', () => {
  it('counts a product site as cited, not absent', () => {
    // The real failure this fixes: a brand question answered with a citation of
    // eksiegowyai.pl scored `absent` while the company had in fact been cited.
    const status = classify({
      text: 'MiCode buduje eKsiegowyAi.',
      hosts: ['eksiegowyai.pl'],
      domain: 'mi-code.pl',
      ownedDomains: OWNED,
      brandTerms: ['MiCode'],
    });
    expect(status).toBe('cited');
  });

  it('still falls back to the single domain when no list is given', () => {
    const status = classify({
      text: '', hosts: ['eksiegowyai.pl'], domain: 'mi-code.pl', brandTerms: ['MiCode'],
    });
    expect(status).toBe('absent');
  });
});

describe('summarize', () => {
  const results = [
    { id: 'a', lang: 'pl', kind: 'category', status: 'cited' },
    { id: 'b', lang: 'pl', kind: 'category', status: 'absent' },
    { id: 'c', lang: 'en', kind: 'brand', status: 'mentioned' },
    { id: 'd', lang: 'en', kind: 'brand', status: 'cited' },
  ];

  it('counts every status per language', () => {
    expect(summarize(results).byLang).toEqual({
      pl: { cited: 1, mentioned: 0, absent: 1 },
      en: { cited: 1, mentioned: 1, absent: 0 },
    });
  });

  it('counts every status per kind', () => {
    expect(summarize(results).byKind).toEqual({
      category: { cited: 1, mentioned: 0, absent: 1 },
      brand: { cited: 1, mentioned: 1, absent: 0 },
    });
  });

  it('reports the cited share over all prompts', () => {
    expect(summarize(results).citedShare).toBeCloseTo(0.5, 5);
  });

  it('reports a zero share for an empty run instead of dividing by zero', () => {
    expect(summarize([]).citedShare).toBe(0);
  });

  it('counts every status per arena', () => {
    const withArena = [
      { id: 'a', lang: 'pl', kind: 'category', arena: 'ours', status: 'cited' },
      { id: 'b', lang: 'pl', kind: 'category', arena: 'ours', status: 'absent' },
      { id: 'c', lang: 'en', kind: 'brand', arena: 'open', status: 'mentioned' },
      { id: 'd', lang: 'en', kind: 'brand', arena: 'open', status: 'absent' },
    ];
    expect(summarize(withArena).byArena).toEqual({
      ours: { cited: 1, mentioned: 0, absent: 1 },
      open: { cited: 0, mentioned: 1, absent: 1 },
    });
  });

  it('groups a result with no arena under open, since an unclassified prompt is not one we can claim', () => {
    const untagged = [
      { id: 'a', lang: 'pl', kind: 'category', status: 'cited' },
      { id: 'b', lang: 'pl', kind: 'category', arena: 'ours', status: 'absent' },
    ];
    expect(summarize(untagged).byArena).toEqual({
      open: { cited: 1, mentioned: 0, absent: 0 },
      ours: { cited: 0, mentioned: 0, absent: 1 },
    });
  });

  it('yields an empty byArena for an empty result list rather than throwing', () => {
    expect(() => summarize([])).not.toThrow();
    expect(summarize([]).byArena).toEqual({});
  });
});
