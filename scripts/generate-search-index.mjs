import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Build-time generator for the site-wide quick search index — see
// docs/contracts/site-wide-quick-search.md. Reads the same data/translation
// sources scripts/prerender.mjs reads, and writes one small JSON array per
// locale to public/, fetched lazily by QuickSearch.svelte only when the
// search overlay first opens (never bundled into every page's JS).

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const products = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf8'));
const blogPosts = JSON.parse(readFileSync(join(root, 'src/data/blog-posts.json'), 'utf8'));
const glossary = JSON.parse(readFileSync(join(root, 'src/data/glossary.json'), 'utf8'));

const LOCALES = ['pl', 'en', 'ru'];
const TITLE_FIELD = { pl: 'titlePl', en: 'titleEn', ru: 'titleRu' };
const SUMMARY_FIELD = { pl: 'summaryPl', en: 'summaryEn', ru: 'summaryRu' };
const DEFINITION_FIELD = { pl: 'definitionPl', en: 'definitionEn', ru: 'definitionRu' };

const translations = {
  pl: JSON.parse(readFileSync(join(root, 'src/data/pl.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(root, 'src/data/en.json'), 'utf8')),
  ru: JSON.parse(readFileSync(join(root, 'src/data/ru.json'), 'utf8')),
};

// Resolve a dot-notation i18n key for a locale (returns the key if unresolved,
// matching src/services/i18n.ts behaviour).
function t(key, lang) {
  const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), translations[lang]);
  return typeof value === 'string' ? value : key;
}

// Reimplemented inline (not imported from src/services/locale.ts) — same
// choice scripts/prerender.mjs already makes for its own canonical-URL
// building, so this Node script has no dependency on the Vite/Svelte build.
function withLocale(path, lang) {
  return lang === 'pl' ? path : `/${lang}${path}`;
}

const pad = n => String(n).padStart(2, '0');
const now = new Date();
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const publishedPosts = blogPosts.filter(post => post.date <= todayStr);

function buildIndex(lang) {
  const productEntries = products.map(product => ({
    type: 'product',
    id: product.id,
    title: t(product.nameKey, lang),
    summary: t(product.descriptionKey, lang),
    tags: [],
    url: withLocale(`/products/${product.id}/`, lang),
  }));

  const blogEntries = publishedPosts.map(post => ({
    type: 'blog',
    id: post.slug,
    title: post[TITLE_FIELD[lang]],
    summary: post[SUMMARY_FIELD[lang]],
    tags: post.tags ?? [],
    url: withLocale(`/blog/${post.slug}/`, lang),
  }));

  const glossaryEntries = glossary.map(term => ({
    type: 'glossary',
    id: term.id,
    title: term.terms[0],
    summary: term[DEFINITION_FIELD[lang]],
    tags: [],
    url: withLocale(`/glossary/#${term.id}`, lang),
  }));

  return [...productEntries, ...blogEntries, ...glossaryEntries];
}

const outDir = join(root, 'public/search-index');
mkdirSync(outDir, { recursive: true });

for (const lang of LOCALES) {
  const index = buildIndex(lang);
  writeFileSync(join(outDir, `${lang}.json`), JSON.stringify(index), 'utf8');
  console.log(`generate-search-index: wrote ${index.length} entries to public/search-index/${lang}.json`);
}
