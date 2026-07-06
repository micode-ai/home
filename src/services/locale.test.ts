import { describe, it, expect } from 'vitest';
import { stripLocale, localizedPath } from './locale';

describe('stripLocale', () => {
  it('returns the route path unchanged for Polish (no prefix)', () => {
    expect(stripLocale('/')).toBe('');
    expect(stripLocale('/products/accounting-ai/')).toBe('products/accounting-ai/');
    expect(stripLocale('/blog/')).toBe('blog/');
  });

  it('strips a leading /en or /ru segment', () => {
    expect(stripLocale('/en/')).toBe('');
    expect(stripLocale('/ru/')).toBe('');
    expect(stripLocale('/en/products/ngx-chat/')).toBe('products/ngx-chat/');
    expect(stripLocale('/ru/blog/scm-ai-agents-supply-chain/')).toBe(
      'blog/scm-ai-agents-supply-chain/'
    );
  });

  it('does not strip look-alike segments that are not locales', () => {
    expect(stripLocale('/enterprise/')).toBe('enterprise/');
    expect(stripLocale('/russia/')).toBe('russia/');
  });
});

describe('localizedPath', () => {
  it('maps the home route across locales', () => {
    expect(localizedPath('/', 'pl')).toBe('/');
    expect(localizedPath('/', 'en')).toBe('/en/');
    expect(localizedPath('/', 'ru')).toBe('/ru/');
  });

  it('maps a deep route across locales', () => {
    expect(localizedPath('/products/testing-ai/', 'en')).toBe('/en/products/testing-ai/');
    expect(localizedPath('/en/products/testing-ai/', 'ru')).toBe('/ru/products/testing-ai/');
    expect(localizedPath('/ru/products/testing-ai/', 'pl')).toBe('/products/testing-ai/');
  });

  it('is idempotent when switching to the same locale', () => {
    expect(localizedPath('/en/blog/', 'en')).toBe('/en/blog/');
    expect(localizedPath('/blog/', 'pl')).toBe('/blog/');
  });
});
