import { describe, it, expect, beforeEach } from 'vitest';
import { getItem, setItem, removeItem } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('setItem() / getItem()', () => {
  it('stores and retrieves a value', () => {
    setItem('key', 'value');
    expect(getItem('key')).toBe('value');
  });

  it('returns null for a key that was never set', () => {
    expect(getItem('missing')).toBeNull();
  });

  it('overwrites an existing value', () => {
    setItem('key', 'first');
    setItem('key', 'second');
    expect(getItem('key')).toBe('second');
  });

  it('returns true on successful set', () => {
    expect(setItem('key', 'val')).toBe(true);
  });
});

describe('removeItem()', () => {
  it('removes an existing key', () => {
    setItem('key', 'value');
    removeItem('key');
    expect(getItem('key')).toBeNull();
  });

  it('returns true when removing an existing key', () => {
    setItem('key', 'value');
    expect(removeItem('key')).toBe(true);
  });

  it('returns true even when key does not exist', () => {
    expect(removeItem('nonexistent')).toBe(true);
  });

  it('does not affect other keys', () => {
    setItem('keep', 'me');
    setItem('remove', 'me');
    removeItem('remove');
    expect(getItem('keep')).toBe('me');
    expect(getItem('remove')).toBeNull();
  });
});
