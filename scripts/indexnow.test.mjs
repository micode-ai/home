import { describe, it, expect } from 'vitest';
import { extractUrls, buildPayload, keyFromFileNames } from './indexnow.mjs';

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mi-code.pl/</loc>
    <lastmod>2026-08-26</lastmod>
  </url>
  <url>
    <loc>https://mi-code.pl/products/ngx-chat/</loc>
  </url>
  <url>
    <loc>
      https://mi-code.pl/ru/blog/o-firmie-micode/
    </loc>
  </url>
</urlset>`;

describe('extractUrls()', () => {
  it('returns every location in the sitemap, in order', () => {
    expect(extractUrls(SITEMAP)).toEqual([
      'https://mi-code.pl/',
      'https://mi-code.pl/products/ngx-chat/',
      'https://mi-code.pl/ru/blog/o-firmie-micode/'
    ]);
  });

  it('trims locations that the generator wrapped across lines', () => {
    expect(extractUrls(SITEMAP)[2]).toBe('https://mi-code.pl/ru/blog/o-firmie-micode/');
  });

  it('ignores lastmod and other siblings', () => {
    expect(extractUrls(SITEMAP).some((url) => url.includes('2026'))).toBe(false);
  });

  it('returns nothing for a sitemap with no URLs', () => {
    expect(extractUrls('<urlset></urlset>')).toEqual([]);
  });
});

describe('buildPayload()', () => {
  const key = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('addresses the host the URLs belong to', () => {
    expect(buildPayload(['https://mi-code.pl/'], key).host).toBe('mi-code.pl');
  });

  it('points at the key file served from that host', () => {
    expect(buildPayload(['https://mi-code.pl/'], key).keyLocation).toBe(
      `https://mi-code.pl/${key}.txt`
    );
  });

  it('carries the key and the full URL list', () => {
    const urls = ['https://mi-code.pl/', 'https://mi-code.pl/blog/'];
    const payload = buildPayload(urls, key);
    expect(payload.key).toBe(key);
    expect(payload.urlList).toEqual(urls);
  });

  it('refuses to build a payload with no URLs, so a broken build cannot ping an empty list', () => {
    expect(() => buildPayload([], key)).toThrow(/no urls/i);
  });

  it('refuses to build a payload without a key', () => {
    expect(() => buildPayload(['https://mi-code.pl/'], '')).toThrow(/key/i);
  });

  it('caps the list at the 10000 URLs IndexNow accepts in one request', () => {
    const many = Array.from({ length: 10500 }, (_, i) => `https://mi-code.pl/p/${i}/`);
    expect(buildPayload(many, key).urlList).toHaveLength(10000);
  });
});

describe('keyFromFileNames()', () => {
  it('recognises the IndexNow key file among the other public files', () => {
    const names = ['robots.txt', 'llms.txt', 'a1b2c3d4e5f60718293a4b5c6d7e8f90.txt', 'CNAME'];
    expect(keyFromFileNames(names)).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90');
  });

  it('ignores text files that are not hex keys', () => {
    expect(keyFromFileNames(['robots.txt', 'llms.txt', 'sitemap.xml'])).toBeNull();
  });

  it('ignores a hex name that is not a .txt file', () => {
    expect(keyFromFileNames(['a1b2c3d4e5f60718293a4b5c6d7e8f90.json'])).toBeNull();
  });

  it('returns null when the directory is empty', () => {
    expect(keyFromFileNames([])).toBeNull();
  });
});
