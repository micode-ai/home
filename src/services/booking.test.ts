import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BOOKING_URL', () => {
  const originalUrl = import.meta.env.VITE_BOOKING_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    import.meta.env.VITE_BOOKING_URL = originalUrl;
  });

  it('falls back to the placeholder Calendly URL when unset', async () => {
    import.meta.env.VITE_BOOKING_URL = '';
    const { BOOKING_URL } = await import('./booking');
    expect(BOOKING_URL).toBe('https://calendly.com/mi-code/30min');
  });

  it('uses VITE_BOOKING_URL when configured', async () => {
    import.meta.env.VITE_BOOKING_URL = 'https://cal.com/mi-code/intro';
    const { BOOKING_URL } = await import('./booking');
    expect(BOOKING_URL).toBe('https://cal.com/mi-code/intro');
  });
});
