import { describe, it, expect, afterEach, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const ok = await copyToClipboard('https://example.com/?tools=80');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/?tools=80');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    const ok = await copyToClipboard('https://example.com/');

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when the Clipboard API is absent', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    const ok = await copyToClipboard('https://example.com/');

    expect(ok).toBe(true);
  });

  it('removes the helper textarea it creates for the fallback path', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(true);

    await copyToClipboard('https://example.com/');

    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('resolves false when every copy path fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);

    const ok = await copyToClipboard('https://example.com/');

    expect(ok).toBe(false);
  });
});
