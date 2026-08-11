import { describe, it, expect } from 'vitest';
import { buildRequest, measure, workList, nextSlice, foldAttempts } from './run.mjs';

const config = {
  domain: 'mi-code.pl',
  brandTerms: ['MiCode'],
  model: 'gemini-2.5-flash',
  mode: 'generateContent',
  apiKey: 'test-key',
};

const slice = [
  { prompt: { id: 'pl-a', lang: 'pl', kind: 'category', target: '/', text: 'pytanie?' }, repeat: 0 },
  { prompt: { id: 'pl-a', lang: 'pl', kind: 'category', target: '/', text: 'pytanie?' }, repeat: 1 },
];

const answer = (uri) => ({
  candidates: [
    {
      content: { parts: [{ text: 'Odpowiedz.' }] },
      groundingMetadata: { groundingChunks: [{ web: { uri, title: 't', domain: null } }] },
    },
  ],
});

const okResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });
const noSleep = async () => {};

describe('buildRequest', () => {
  it('targets the classic endpoint with the google_search tool', () => {
    const { url, body } = buildRequest('generateContent', 'gemini-2.5-flash', 'hi');
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
    expect(body.tools).toEqual([{ google_search: {} }]);
    expect(body.contents[0].parts[0].text).toBe('hi');
  });

  it('targets the interactions endpoint with the typed tool', () => {
    const { url, body } = buildRequest('interactions', 'gemini-2.5-flash', 'hi');
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(body.tools).toEqual([{ type: 'google_search' }]);
    expect(body.input).toBe('hi');
  });
});

describe('measure', () => {
  it('calls the API once per prompt per repeat', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return okResponse(answer('https://example.com/'));
    };
    const result = await measure({ ...config, slice }, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(result.calls).toBe(2);
  });

  it('sends the key in the x-goog-api-key header', async () => {
    let headers;
    const fetchImpl = async (_url, options) => {
      headers = options.headers;
      return okResponse(answer('https://example.com/'));
    };
    await measure({ ...config, slice }, { fetchImpl, sleep: noSleep });
    expect(headers['x-goog-api-key']).toBe('test-key');
  });

  it('returns one attempt per repeat, each with its own status', async () => {
    const pages = [answer('https://example.com/'), answer('https://mi-code.pl/')];
    const fetchImpl = async () => okResponse(pages.shift());
    const { attempts } = await measure({ ...config, slice }, { fetchImpl, sleep: noSleep });
    expect(attempts.map((a) => a.status)).toEqual(['absent', 'cited']);
  });

  it('retries once on a rate limit and then succeeds', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 429, text: async () => 'slow down' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    const { attempts } = await measure({ ...config, slice: slice.slice(0, 1) }, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(attempts[0].status).toBe('cited');
  });

  it('aborts the whole run when a call fails twice, rather than saving half a measurement', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, text: async () => 'boom' });
    await expect(
      measure({ ...config, slice: slice.slice(0, 1) }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/500/);
  });

  it('paces its calls so the free tier per-minute limit is not tripped', async () => {
    // The first live run fired 54 calls back to back and died on a 429 within
    // seconds, while a single call at rest succeeded — the limit is per minute,
    // and the gap between calls is the whole fix.
    const waits = [];
    const fetchImpl = async () => okResponse(answer('https://example.com/'));
    const sleep = async (ms) => { waits.push(ms); };
    await measure({ ...config, slice, delayMs: 6500 }, { fetchImpl, sleep });
    // Two calls, so exactly one gap — and nothing waited before the first.
    expect(waits).toEqual([6500]);
  });

  it('waits out a rate limit for longer than a server error', async () => {
    const waits = [];
    const sleep = async (ms) => { waits.push(ms); };
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 429, text: async () => 'slow down' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    await measure({ ...config, slice: slice.slice(0, 1), delayMs: 0 }, { fetchImpl, sleep });
    expect(waits).toEqual([30000]);
  });

  it('waits only the short delay after a server error', async () => {
    // Without this, "longer than a server error" is an untested claim: mutation
    // testing showed the 429 branch alone still passes if both delays are made
    // equal. The pair of assertions is what pins the asymmetry.
    const waits = [];
    const sleep = async (ms) => { waits.push(ms); };
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 500, text: async () => 'boom' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    await measure({ ...config, slice: slice.slice(0, 1), delayMs: 0 }, { fetchImpl, sleep });
    expect(waits).toEqual([5000]);
  });

  it('does not retry a 400, which will fail identically the second time', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: false, status: 400, text: async () => 'bad model' };
    };
    await expect(
      measure({ ...config, slice: slice.slice(0, 1) }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/400/);
    expect(calls).toBe(1);
  });
});

describe('workList', () => {
  it('expands every prompt once per repeat, in a stable order', () => {
    const prompts = [{ id: 'a' }, { id: 'b' }];
    expect(workList(prompts, 2).map((i) => `${i.prompt.id}#${i.repeat}`))
      .toEqual(['a#0', 'a#1', 'b#0', 'b#1']);
  });

  it('is empty when there are no prompts', () => {
    expect(workList([], 2)).toEqual([]);
  });
});

describe('nextSlice', () => {
  const items = [1, 2, 3, 4, 5];

  it('takes the budget from the cursor and reports where to resume', () => {
    expect(nextSlice(items, 0, 2)).toEqual({ slice: [1, 2], nextCursor: 2, complete: false });
  });

  it('stops at the end rather than running past it', () => {
    expect(nextSlice(items, 4, 3)).toEqual({ slice: [5], nextCursor: 5, complete: true });
  });

  it('reports completion exactly when the last item is taken', () => {
    expect(nextSlice(items, 3, 2).complete).toBe(true);
    expect(nextSlice(items, 2, 2).complete).toBe(false);
  });

  it('handles a budget larger than the whole list', () => {
    expect(nextSlice(items, 0, 99)).toEqual({ slice: items, nextCursor: 5, complete: true });
  });
});

describe('foldAttempts', () => {
  it('groups attempts by prompt and keeps the strongest status', () => {
    const attempts = [
      { id: 'a', lang: 'pl', kind: 'category', target: '/', status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: ['x.pl'] },
      { id: 'a', lang: 'pl', kind: 'category', target: '/', status: 'cited', citedUrls: ['https://mi-code.pl/'], citedDomains: ['mi-code.pl'], sourceDomains: ['mi-code.pl'] },
      { id: 'b', lang: 'en', kind: 'brand', target: '/', status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: [] },
    ];
    const results = foldAttempts(attempts);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 'a', lang: 'pl', kind: 'category', status: 'cited' });
    expect(results[0].attempts).toHaveLength(2);
    expect(results[1]).toMatchObject({ id: 'b', status: 'absent' });
  });

  it('preserves the order in which prompts were first seen', () => {
    const attempts = [
      { id: 'b', status: 'absent' }, { id: 'a', status: 'absent' }, { id: 'b', status: 'cited' },
    ];
    expect(foldAttempts(attempts).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('returns nothing for no attempts', () => {
    expect(foldAttempts([])).toEqual([]);
  });
});
