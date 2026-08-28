import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const LOCALES = ['pl', 'en', 'ru'];

const translations = {
  pl: JSON.parse(readFileSync(join(root, 'src/data/pl.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(root, 'src/data/en.json'), 'utf8')),
  ru: JSON.parse(readFileSync(join(root, 'src/data/ru.json'), 'utf8')),
};

const services = JSON.parse(readFileSync(join(root, 'src/data/services.json'), 'utf8'));

// Same values already hardcoded at the other two call sites in the app
// (ContactForm.svelte's CONTACT_EMAIL, SEO.svelte's site URL) — not worth a shared
// module for two consumers.
const CONTACT_EMAIL = 'development@mi-code.pl';
const SITE_URL = 'https://mi-code.pl';

// Certificate titles only (no images — keeps the PDF one page and text-selectable).
// Not translated in the source JSON either, so a single locale-independent list.
const CERTIFICATIONS = [
  'NVIDIA — Getting Started with Deep Learning (2026)',
  'Oracle Application Development Framework 11g Certified Implementation Specialist (2014)',
  'Hugging Face Agents Course — Fundamentals of Agents (2025)',
  'Hugging Face LLM Course — Fundamentals of LLMs (2025)',
  'Hugging Face MCP Course — Fundamentals of MCP (2025)',
];

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLOR_HEADING = rgb(0.059, 0.09, 0.165); // #0F172A
const COLOR_ACCENT = rgb(0.976, 0.451, 0.086); // #F97316
const COLOR_TEXT = rgb(0.17, 0.2, 0.24);
const COLOR_MUTED = rgb(0.45, 0.48, 0.52);
const COLOR_RULE = rgb(0.85, 0.86, 0.88);

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function truncateToLines(text, font, size, maxWidth, maxLines) {
  const lines = wrapText(text, font, size, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (font.widthOfTextAtSize(`${last}…`, size) > maxWidth && last.includes(' ')) {
    last = last.slice(0, last.lastIndexOf(' '));
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

function buildProfile(locale) {
  const t = translations[locale];

  return {
    companyName: 'MiCode Sp. z o.o.',
    tagline: t.hero.subheadline,
    companyTitle: t.company.title,
    companyFields: [
      [t.company.founded, t.company.foundedYear],
      [t.company.location, t.company.address],
      [t.company.nip, t.company.nipValue],
      [t.company.regon, t.company.regonValue],
    ],
    servicesTitle: t.services.title,
    services: services.map((service) => {
      const [, group] = service.titleKey.match(/^services\.(\w+)\.title$/) ?? [];
      return {
        title: t.services[group]?.title ?? service.titleKey,
        description: t.services[group]?.description ?? '',
      };
    }),
    founderTitle: t.founder.title,
    founderName: t.founder.name,
    founderExperience: t.founder.experienceValue,
    founderBio: t.founder.bio,
    careerHighlightsTitle: t.founder.careerHighlights,
    highlights: Object.values(t.founder.highlights).map((h) => ({
      company: h.company,
      duration: h.duration,
      description: h.description,
    })),
    certificatesTitle: t.certificates.title,
    contactTitle: t.nav.contact,
  };
}

async function renderCompanyProfilePdf(locale, fonts) {
  const profile = buildProfile(locale);
  const { regular, bold } = fonts;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const regularFont = await pdfDoc.embedFont(regular);
  const boldFont = await pdfDoc.embedFont(bold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function drawText(text, { font = regularFont, size = 10, color = COLOR_TEXT, x = MARGIN } = {}) {
    page.drawText(text, { x, y, size, font, color });
  }

  function advance(amount) {
    y -= amount;
  }

  function drawRule() {
    advance(6);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.75,
      color: COLOR_RULE,
    });
    advance(14);
  }

  function drawWrapped(text, { font = regularFont, size = 10, color = COLOR_TEXT, lineHeight = 13, maxLines } = {}) {
    const lines = maxLines
      ? truncateToLines(text, font, size, CONTENT_WIDTH, maxLines)
      : wrapText(text, font, size, CONTENT_WIDTH);
    for (const line of lines) {
      drawText(line, { font, size, color });
      advance(lineHeight);
    }
  }

  // Header
  drawText(profile.companyName, { font: boldFont, size: 22, color: COLOR_HEADING });
  advance(20);
  drawWrapped(profile.tagline, { size: 11, color: COLOR_MUTED, lineHeight: 14, maxLines: 2 });
  drawRule();

  // Company info
  drawText(profile.companyTitle.toUpperCase(), { font: boldFont, size: 11, color: COLOR_ACCENT });
  advance(16);
  for (const [label, value] of profile.companyFields) {
    drawText(`${label}: ${value}`, { size: 10 });
    advance(14);
  }
  advance(6);
  drawRule();

  // Services
  drawText(profile.servicesTitle.toUpperCase(), { font: boldFont, size: 11, color: COLOR_ACCENT });
  advance(16);
  for (const service of profile.services) {
    drawText(service.title, { font: boldFont, size: 10 });
    advance(13);
    drawWrapped(service.description, { size: 9.5, color: COLOR_TEXT, lineHeight: 12, maxLines: 2 });
    advance(4);
  }
  drawRule();

  // Founder
  drawText(profile.founderTitle.toUpperCase(), { font: boldFont, size: 11, color: COLOR_ACCENT });
  advance(16);
  drawText(`${profile.founderName} — ${profile.founderExperience}`, { font: boldFont, size: 10.5 });
  advance(15);
  drawWrapped(profile.founderBio, { size: 9.5, lineHeight: 12, maxLines: 5 });
  advance(6);
  drawText(profile.careerHighlightsTitle, { font: boldFont, size: 9.5, color: COLOR_MUTED });
  advance(13);
  for (const highlight of profile.highlights) {
    drawText(`${highlight.company} (${highlight.duration})`, { font: boldFont, size: 9.5 });
    advance(12);
    drawWrapped(highlight.description, { size: 9, color: COLOR_TEXT, lineHeight: 11, maxLines: 1 });
    advance(3);
  }
  drawRule();

  // Certifications
  drawText(profile.certificatesTitle.toUpperCase(), { font: boldFont, size: 11, color: COLOR_ACCENT });
  advance(16);
  for (const cert of CERTIFICATIONS) {
    drawWrapped(`• ${cert}`, { size: 9, lineHeight: 12, maxLines: 1 });
  }
  drawRule();

  // Contact
  drawText(profile.contactTitle.toUpperCase(), { font: boldFont, size: 11, color: COLOR_ACCENT });
  advance(16);
  drawText(`${CONTACT_EMAIL}   ·   ${SITE_URL}`, { font: boldFont, size: 10.5, color: COLOR_HEADING });

  return pdfDoc.save();
}

async function run() {
  const outDir = join(root, 'public/downloads');
  mkdirSync(outDir, { recursive: true });

  const fonts = {
    regular: readFileSync(join(__dirname, 'og-fonts/OpenSans-Regular.ttf')),
    bold: readFileSync(join(__dirname, 'og-fonts/OpenSans-Bold.ttf')),
  };

  let written = 0;
  let failed = 0;

  for (const locale of LOCALES) {
    try {
      const bytes = await renderCompanyProfilePdf(locale, fonts);
      writeFileSync(join(outDir, `micode-company-profile-${locale}.pdf`), bytes);
      written += 1;
    } catch (err) {
      failed += 1;
      console.warn(`  ! failed to generate company profile PDF for "${locale}": ${err.message}`);
    }
  }

  console.log(`Generated ${written} company profile PDF(s)${failed ? `, ${failed} failed` : ''}.`);
}

// Only run the generation pipeline when this file is executed directly
// (`node scripts/generate-company-profile-pdf.mjs`) — not when imported by its unit test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((err) => {
    console.error('Company profile PDF generation failed:', err);
    process.exit(1);
  });
}

export { buildProfile, wrapText, truncateToLines, renderCompanyProfilePdf };
