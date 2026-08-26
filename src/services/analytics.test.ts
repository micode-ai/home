import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * The measurement id is read at module load, so each case needs a fresh module
 * with the env already stubbed.
 */
async function loadAnalytics(id: string | null = 'G-TEST12345') {
  vi.resetModules();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', id ?? '');
  return import('./analytics');
}

function lastQueued() {
  const queue = window.dataLayer!;
  return queue[queue.length - 1];
}

beforeEach(() => {
  delete window.gtag;
  delete window.dataLayer;
  document.head.querySelectorAll('script').forEach((s) => s.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('initializeAnalytics()', () => {
  it('injects the gtag.js script for the configured measurement id', async () => {
    const { initializeAnalytics } = await loadAnalytics('G-TEST12345');
    initializeAnalytics();
    const script = document.head.querySelector<HTMLScriptElement>('script[src*="googletagmanager"]');
    expect(script?.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST12345');
  });

  it('does nothing when no measurement id is configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initializeAnalytics } = await loadAnalytics(null);
    initializeAnalytics();
    expect(document.head.querySelector('script[src*="googletagmanager"]')).toBeNull();
    warn.mockRestore();
  });

  it('queues the js and config commands', async () => {
    const { initializeAnalytics } = await loadAnalytics('G-TEST12345');
    initializeAnalytics();
    const commands = window.dataLayer!.map((entry) => Array.from(entry as ArrayLike<unknown>)[0]);
    expect(commands).toContain('js');
    expect(commands).toContain('config');
  });

  it('configures the measurement id it was given', async () => {
    const { initializeAnalytics } = await loadAnalytics('G-TEST12345');
    initializeAnalytics();
    const config = window
      .dataLayer!.map((entry) => Array.from(entry as ArrayLike<unknown>))
      .find((args) => args[0] === 'config');
    expect(config?.[1]).toBe('G-TEST12345');
  });
});

describe('the gtag shim', () => {
  /**
   * gtag.js tells its own commands apart from ordinary dataLayer data by type:
   * it only acts on entries that are `[object Arguments]`. Pushing a real array
   * — which rest parameters produce — leaves every command silently ignored, so
   * the library loads, registers its container, and then collects nothing.
   */
  it('queues commands as an Arguments object, not an array', async () => {
    const { initializeAnalytics } = await loadAnalytics();
    initializeAnalytics();

    window.gtag!('event', 'probe', { a: 1 });

    expect(Object.prototype.toString.call(lastQueued())).toBe('[object Arguments]');
  });

  it('queues the js and config commands as Arguments objects too', async () => {
    const { initializeAnalytics } = await loadAnalytics();
    initializeAnalytics();

    const types = window.dataLayer!.map((entry) => Object.prototype.toString.call(entry));

    expect(types).toEqual(['[object Arguments]', '[object Arguments]']);
  });

  it('preserves every argument in order', async () => {
    const { initializeAnalytics } = await loadAnalytics();
    initializeAnalytics();

    window.gtag!('event', 'generate_lead', { form: 'contact' });

    expect(Array.from(lastQueued() as ArrayLike<unknown>)).toEqual([
      'event',
      'generate_lead',
      { form: 'contact' }
    ]);
  });
});
