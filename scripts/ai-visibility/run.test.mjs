import { describe, it, expect } from 'vitest';
import { buildRequest, measure } from './run.mjs';

const config = {
  domain: 'mi-code.pl',
  brandTerms: ['MiCode'],
  model: 'gemini-2.5-flash',
  mode: 'generateContent',
  repeats: 2,
  apiKey: 'test-key',
  prompts: [
    { id: 'pl-a', lang: 'pl', kind: 'category', target: '/', text: 'pytanie?' },
  ],
};

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
    const result = await measure(config, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(result.calls).toBe(2);
  });

  it('sends the key in the x-goog-api-key header', async () => {
    let headers;
    const fetchImpl = async (_url, options) => {
      headers = options.headers;
      return okResponse(answer('https://example.com/'));
    };
    await measure(config, { fetchImpl, sleep: noSleep });
    expect(headers['x-goog-api-key']).toBe('test-key');
  });

  it('keeps the strongest status across the repeats', async () => {
    const pages = [answer('https://example.com/'), answer('https://mi-code.pl/')];
    const fetchImpl = async () => okResponse(pages.shift());
    const { results } = await measure(config, { fetchImpl, sleep: noSleep });
    expect(results[0].status).toBe('cited');
    expect(results[0].attempts).toHaveLength(2);
    expect(results[0].attempts[0].status).toBe('absent');
  });

  it('retries once on a rate limit and then succeeds', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 429, text: async () => 'slow down' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    const { results } = await measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(results[0].status).toBe('cited');
  });

  it('aborts the whole run when a call fails twice, rather than saving half a measurement', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, text: async () => 'boom' });
    await expect(
      measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/500/);
  });

  it('paces its calls so the free tier per-minute limit is not tripped', async () => {
    // The first live run fired 54 calls back to back and died on a 429 within
    // seconds, while a single call at rest succeeded — the limit is per minute,
    // and the gap between calls is the whole fix.
    const waits = [];
    const fetchImpl = async () => okResponse(answer('https://example.com/'));
    const sleep = async (ms) => { waits.push(ms); };
    await measure({ ...config, delayMs: 6500 }, { fetchImpl, sleep });
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
    await measure({ ...config, repeats: 1, delayMs: 0 }, { fetchImpl, sleep });
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
    await measure({ ...config, repeats: 1, delayMs: 0 }, { fetchImpl, sleep });
    expect(waits).toEqual([5000]);
  });

  it('does not retry a 400, which will fail identically the second time', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: false, status: 400, text: async () => 'bad model' };
    };
    await expect(
      measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/400/);
    expect(calls).toBe(1);
  });
});
