// @vitest-environment node
//
// pdf-lib's internal type checks use `instanceof Uint8Array`/`ArrayBuffer`, which break
// across jsdom's separate realm (the project's default test environment) — a Node
// Buffer read via fs is not `instanceof` jsdom's own Uint8Array. This file needs the
// real Node environment, not jsdom, since it exercises pdf-lib/fontkit directly.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { describe, it, expect } from 'vitest';
import {
  buildProfile,
  wrapText,
  truncateToLines,
  renderCompanyProfilePdf,
} from './generate-company-profile-pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fonts = {
  regular: readFileSync(join(root, 'scripts/og-fonts/OpenSans-Regular.ttf')),
  bold: readFileSync(join(root, 'scripts/og-fonts/OpenSans-Bold.ttf')),
};

async function embedRegularFont() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  return doc.embedFont(fonts.regular);
}

describe('wrapText', () => {
  it('keeps short text on a single line', async () => {
    const font = await embedRegularFont();
    expect(wrapText('Short line', font, 10, 500)).toEqual(['Short line']);
  });

  it('wraps long text across multiple lines within the given width', async () => {
    const font = await embedRegularFont();
    const text = 'word '.repeat(60).trim();
    const lines = wrapText(text, font, 10, 100);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100);
    }
  });
});

describe('truncateToLines', () => {
  it('returns all lines unchanged when under the limit', async () => {
    const font = await embedRegularFont();
    const lines = truncateToLines('one two three', font, 10, 500, 3);
    expect(lines).toEqual(['one two three']);
  });

  it('truncates with an ellipsis and terminates when over the line limit', async () => {
    const font = await embedRegularFont();
    const text = 'word '.repeat(80).trim();
    const lines = truncateToLines(text, font, 10, 100, 2);
    expect(lines.length).toBe(2);
    expect(lines[1].endsWith('…')).toBe(true);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100);
    }
  });
});

describe('buildProfile', () => {
  it('resolves real service titles/descriptions for every locale, not raw i18n keys', () => {
    for (const locale of ['pl', 'en', 'ru']) {
      const profile = buildProfile(locale);
      expect(profile.services.length).toBeGreaterThan(0);
      for (const service of profile.services) {
        expect(service.title).not.toMatch(/^services\./);
        expect(service.description).not.toMatch(/^services\./);
        expect(service.title.length).toBeGreaterThan(0);
      }
    }
  });

  it('carries over founder and company identity fields', () => {
    const profile = buildProfile('en');
    expect(profile.founderName).toBe('Mikhail Peraviortkin');
    expect(profile.companyName).toBe('MiCode Sp. z o.o.');
    expect(profile.highlights.length).toBe(4);
  });
});

describe('renderCompanyProfilePdf', () => {
  it('produces a single A4 page for each locale', async () => {
    for (const locale of ['pl', 'en', 'ru']) {
      const bytes = await renderCompanyProfilePdf(locale, fonts);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      const { width, height } = doc.getPage(0).getSize();
      expect(width).toBeCloseTo(595.28, 1);
      expect(height).toBeCloseTo(841.89, 1);
    }
  });
});
