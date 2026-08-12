import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  buildRequest, measure, workList, nextSlice, foldAttempts, promptsFingerprint, main,
} from './run.mjs';

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

  it('retries a dropped connection instead of losing the whole sweep', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('fetch failed');
      return okResponse(answer('https://mi-code.pl/'));
    };
    const { attempts } = await measure(
      { ...config, slice: slice.slice(0, 1) }, { fetchImpl, sleep: noSleep },
    );
    expect(calls).toBe(2);
    expect(attempts[0].status).toBe('cited');
  });

  it('gives up when the connection drops twice', async () => {
    const fetchImpl = async () => { throw new TypeError('fetch failed'); };
    await expect(
      measure({ ...config, slice: slice.slice(0, 1) }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/unreachable/);
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

  it('measures nothing and calls nothing for an empty slice', async () => {
    // main() now lets an empty-but-complete slice through so it can close the
    // sweep, which means measure() is handed [] on that path — it must not
    // reach the network or the closing day would burn quota for no reason.
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return okResponse(answer('https://example.com/'));
    };
    const result = await measure({ ...config, slice: [] }, { fetchImpl, sleep: noSleep });
    expect(result).toEqual({ attempts: [], calls: 0 });
    expect(calls).toBe(0);
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

describe('promptsFingerprint', () => {
  const prompts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('is the same for the same ids and repeats', () => {
    expect(promptsFingerprint(prompts, 2))
      .toBe(promptsFingerprint([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 2));
  });

  it('changes when a prompt id changes', () => {
    expect(promptsFingerprint([{ id: 'a' }, { id: 'B' }, { id: 'c' }], 2))
      .not.toBe(promptsFingerprint(prompts, 2));
  });

  it('changes when a prompt is added', () => {
    expect(promptsFingerprint([...prompts, { id: 'd' }], 2))
      .not.toBe(promptsFingerprint(prompts, 2));
  });

  it('changes when a prompt is removed', () => {
    expect(promptsFingerprint(prompts.slice(0, 2), 2))
      .not.toBe(promptsFingerprint(prompts, 2));
  });

  it('changes when the prompts are reordered, because the cursor is positional', () => {
    expect(promptsFingerprint([{ id: 'b' }, { id: 'a' }, { id: 'c' }], 2))
      .not.toBe(promptsFingerprint(prompts, 2));
  });

  it('changes when the repeat count changes', () => {
    expect(promptsFingerprint(prompts, 3)).not.toBe(promptsFingerprint(prompts, 2));
  });
});

describe('main', () => {
  // Every branch below only ever runs inside the daily job, so it goes
  // untested unless main() is driven over a scratch directory and a stub
  // transport. Three shipped bugs lived here.
  const ENV = [
    'GEMINI_API_KEY', 'AI_VIS_DATE', 'AI_VIS_REPEATS', 'AI_VIS_DAILY_BUDGET',
    'AI_VIS_DELAY_MS', 'AI_VIS_MODEL', 'AI_VIS_ENDPOINT', 'GITHUB_OUTPUT',
  ];

  const promptSet = {
    domain: 'mi-code.pl',
    ownedDomains: ['mi-code.pl'],
    brandTerms: ['MiCode'],
    prompts: [
      { id: 'p1', lang: 'pl', kind: 'category', target: '/', text: 'pytanie?' },
      { id: 'p2', lang: 'en', kind: 'brand', target: '/', text: 'question?' },
    ],
  };

  const attempt = (id) => ({
    id, lang: 'pl', kind: 'category', target: '/', status: 'cited',
    citedUrls: [], citedDomains: [], sourceDomains: [],
  });

  let dir;
  let saved;
  let fetched;
  let deps;
  let logged;

  const readJson = (...parts) => JSON.parse(readFileSync(join(dir, ...parts), 'utf8'));

  beforeEach(() => {
    saved = Object.fromEntries(ENV.map((key) => [key, process.env[key]]));
    dir = mkdtempSync(join(tmpdir(), 'ai-vis-'));
    writeFileSync(join(dir, 'prompts.json'), JSON.stringify(promptSet));

    process.env.GEMINI_API_KEY = 'test-key';
    process.env.AI_VIS_DATE = '2026-08-13';
    process.env.AI_VIS_REPEATS = '1';
    process.env.AI_VIS_DAILY_BUDGET = '18';
    process.env.AI_VIS_DELAY_MS = '0';
    delete process.env.AI_VIS_MODEL;
    delete process.env.AI_VIS_ENDPOINT;
    delete process.env.GITHUB_OUTPUT;

    fetched = 0;
    deps = {
      fetchImpl: async () => {
        fetched += 1;
        return okResponse(answer('https://example.com/'));
      },
      sleep: noSleep,
    };
    logged = [];
    vi.spyOn(console, 'log').mockImplementation((line) => { logged.push(String(line)); });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  const useGithubOutput = () => {
    const path = join(dir, 'github-output');
    writeFileSync(path, '');
    process.env.GITHUB_OUTPUT = path;
    return path;
  };

  it('publishes no alert body when the citation set did not move', async () => {
    // renderAlert always returns a header line, so an unconditional alert output
    // made the workflow's "did anything go wrong" test unfalsifiable: a failed
    // push reported a normal result to the ops channel.
    const path = useGithubOutput();
    await main({ dir, deps });
    expect(readFileSync(path, 'utf8')).toBe('changed=false\n');
  });

  it('publishes the alert body when the citation set moved', async () => {
    mkdirSync(join(dir, 'runs'), { recursive: true });
    writeFileSync(
      join(dir, 'runs', '2026-08-10.json'),
      JSON.stringify({ date: '2026-08-10', results: [{ id: 'p1', status: 'cited' }] }),
    );
    const path = useGithubOutput();
    await main({ dir, deps });
    const output = readFileSync(path, 'utf8');
    expect(output).toContain('changed=true');
    expect(output).toContain('alert<<ALERT_EOF');
    expect(output).toContain('Lost: p1');
  });

  it('closes the sweep when the cursor has run past the end of the work list', async () => {
    // A work list that shrank below the stored cursor used to wedge the sweep
    // forever: an empty slice returned early, partial.json was never reset, and
    // the job logged "already complete" and exited 0 every day.
    writeFileSync(join(dir, 'partial.json'), JSON.stringify({
      sweep: 4,
      cursor: 9,
      attempts: [attempt('p1')],
      calls: 6,
      started: '2026-08-11',
      fingerprint: promptsFingerprint(promptSet.prompts, 1),
    }));

    await main({ dir, deps });

    expect(fetched).toBe(0);
    expect(existsSync(join(dir, 'runs', '2026-08-13.json'))).toBe(true);
    expect(existsSync(join(dir, 'REPORT.md'))).toBe(true);
    expect(readJson('partial.json')).toMatchObject({ sweep: 5, cursor: 0, attempts: [], calls: 0 });
  });

  it('goes red on a malformed daily budget instead of quietly measuring nothing', async () => {
    process.env.AI_VIS_DAILY_BUDGET = 'abc';
    await expect(main({ dir, deps })).rejects
      .toThrow('AI_VIS_DAILY_BUDGET must be a positive integer, got "abc"');
    expect(fetched).toBe(0);
  });

  it('goes red on a non-positive repeat count', async () => {
    process.env.AI_VIS_REPEATS = '0';
    await expect(main({ dir, deps })).rejects
      .toThrow('AI_VIS_REPEATS must be a positive integer, got "0"');
  });

  describe('asPositiveInt (exercised through AI_VIS_REPEATS)', () => {
    // An unset Actions variable renders as '', not undefined — both must fall
    // back to the default rather than being treated as a bad value, or the job
    // goes red every morning a variable is simply left unconfigured.
    it('falls back to the default when the value is an empty string', async () => {
      process.env.AI_VIS_REPEATS = '';
      await main({ dir, deps });
      // 2 prompts * DEFAULT_REPEATS (2) = 4 calls.
      expect(readJson('runs', '2026-08-13.json').calls).toBe(4);
    });

    it('falls back to the default when the value is undefined', async () => {
      delete process.env.AI_VIS_REPEATS;
      await main({ dir, deps });
      expect(readJson('runs', '2026-08-13.json').calls).toBe(4);
    });

    it('throws on a non-numeric string', async () => {
      process.env.AI_VIS_REPEATS = 'abc';
      await expect(main({ dir, deps })).rejects
        .toThrow('AI_VIS_REPEATS must be a positive integer, got "abc"');
      expect(fetched).toBe(0);
    });

    it('throws on "0"', async () => {
      process.env.AI_VIS_REPEATS = '0';
      await expect(main({ dir, deps })).rejects
        .toThrow('AI_VIS_REPEATS must be a positive integer, got "0"');
      expect(fetched).toBe(0);
    });

    it('throws on a negative value', async () => {
      process.env.AI_VIS_REPEATS = '-3';
      await expect(main({ dir, deps })).rejects
        .toThrow('AI_VIS_REPEATS must be a positive integer, got "-3"');
      expect(fetched).toBe(0);
    });

    it('uses a valid value', async () => {
      process.env.AI_VIS_REPEATS = '3';
      await main({ dir, deps });
      // 2 prompts * 3 repeats = 6 calls.
      expect(readJson('runs', '2026-08-13.json').calls).toBe(6);
    });
  });

  it('abandons the sweep in progress when the prompt set changed under it', async () => {
    writeFileSync(join(dir, 'partial.json'), JSON.stringify({
      sweep: 3,
      cursor: 1,
      attempts: [attempt('a-prompt-that-was-deleted')],
      calls: 1,
      started: '2026-08-12',
      fingerprint: 'stale0000beef',
    }));

    await main({ dir, deps });

    const run = readJson('runs', '2026-08-13.json');
    expect(run.sweep).toBe(4);
    // Measured from zero against the current list — no carried-over attempt for
    // a prompt that no longer exists, and no prompt skipped by a stale cursor.
    expect(run.results.map((result) => result.id)).toEqual(['p1', 'p2']);
    expect(run.calls).toBe(2);
    expect(logged.join('\n')).toContain('prompt set changed — abandoning sweep 3 at 1/1');
  });

  it('stores the fingerprint on the sweep it opens, so the next day resumes', async () => {
    // The easy half of this fix to forget: without the fingerprint on the
    // closing write, every following run reads back a mismatch and restarts.
    await main({ dir, deps });
    expect(readJson('partial.json')).toMatchObject({
      sweep: 2,
      cursor: 0,
      fingerprint: promptsFingerprint(promptSet.prompts, 1),
    });
  });

  it('resumes an unfinished sweep the next day rather than starting over', async () => {
    process.env.AI_VIS_DAILY_BUDGET = '1';
    await main({ dir, deps });
    expect(readJson('partial.json')).toMatchObject({ sweep: 1, cursor: 1 });

    process.env.AI_VIS_DATE = '2026-08-14';
    await main({ dir, deps });

    const run = readJson('runs', '2026-08-14.json');
    expect(run.sweep).toBe(1);
    expect(run.started).toBe('2026-08-13');
    expect(run.calls).toBe(2);
    expect(run.results.map((result) => result.id)).toEqual(['p1', 'p2']);
    expect(logged.join('\n')).not.toContain('prompt set changed');
  });
});
