#!/usr/bin/env node
/**
 * Register one blog article from a payload file, without anyone having to open
 * src/data/blog-posts.json.
 *
 * That file is the reason this script exists: 17 articles with three full
 * language bodies each make it ~780 KB, and an agent that reads it to append an
 * entry runs out of context before it writes anything (one write-article
 * session burned 11 minutes and $1.66 doing exactly that, and produced no
 * article). Everything here is read-modify-write with nothing echoed back, so
 * the caller never pays for the file's size.
 *
 * Usage:
 *   node scripts/add-blog-post.mjs <payload.json> [--template <slug>] [--dry-run]
 *
 * The payload is one blog-posts.json entry plus an optional `page` object for
 * the parts of blog/<slug>/index.html that are authored rather than derived:
 *
 *   {
 *     "slug": "kebab-case",
 *     "titlePl": "...", "titleEn": "...", "titleRu": "...",
 *     "summaryPl": "...", "summaryEn": "...", "summaryRu": "...",
 *     "date": "2026-08-22",
 *     "tags": ["AI", "..."],
 *     "bodyPl": "...", "bodyEn": "...", "bodyRu": "...",
 *     "faq": [{ "qPl": "", "qEn": "", "qRu": "", "aPl": "", "aEn": "", "aRu": "" }],
 *
 *     // optional, present on the newer entries
 *     "metaTitleEn": "...", "metaTitleRu": "...",
 *     "metaDescriptionEn": "...", "metaDescriptionRu": "...",
 *     "relatedProductSlug": "accounting-ai",
 *
 *     // optional page head; both fall back to summaryPl
 *     "page": { "metaDescription": "<=160 chars", "ldDescription": "...",
 *               "keywords": ["extra", "schema", "keywords"],
 *               "llmsDescription": "one sentence for llms.txt" }
 *   }
 *
 * It writes five things, the same five a human does by hand:
 *   1. the entry appended to src/data/blog-posts.json
 *   2. blog/<slug>/index.html   (head + JSON-LD generated; scaffolding copied)
 *   3. blog/<slug>/main.ts
 *   4. one input line in vite.config.ts
 *   5. one line under "## Blog" in public/llms.txt, the curated map answer
 *      engines read. That file is hand-maintained, and three of eighteen
 *      articles were missing from it before this step existed.
 *
 * Nothing is written unless every check passes, so a rejected payload leaves
 * the repository exactly as it was.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src', 'data', 'blog-posts.json');
const VITE = join(ROOT, 'vite.config.ts');
const SITE = 'https://mi-code.pl';

const REQUIRED = [
  'slug', 'titlePl', 'titleEn', 'titleRu',
  'summaryPl', 'summaryEn', 'summaryRu',
  'date', 'tags', 'bodyPl', 'bodyEn', 'bodyRu', 'faq',
];
const FAQ_KEYS = ['qPl', 'qEn', 'qRu', 'aPl', 'aEn', 'aRu'];
const OPTIONAL = [
  'metaTitleEn', 'metaTitleRu', 'metaDescriptionEn', 'metaDescriptionRu',
  'relatedProductSlug', 'aiModelsTable',
];

function die(msg) {
  console.error(`add-blog-post: ${msg}`);
  process.exit(1);
}

function htmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const tplIdx = argv.indexOf('--template');
const templateSlug = tplIdx === -1 ? null : argv[tplIdx + 1];
const payloadPath = argv.find(
  (a, i) => !a.startsWith('--') && argv[i - 1] !== '--template',
);
if (!payloadPath) {
  die('usage: node scripts/add-blog-post.mjs <payload.json> [--template <slug>] [--dry-run]');
}

let payload;
try {
  payload = JSON.parse(readFileSync(resolve(payloadPath), 'utf8'));
} catch (e) {
  die(`cannot read payload ${payloadPath}: ${e.message}`);
}

// ------------------------------------------------------------- validation
const page = payload.page ?? {};
delete payload.page;

for (const k of REQUIRED) {
  if (payload[k] === undefined || payload[k] === null || payload[k] === '') {
    die(`payload is missing required key "${k}"`);
  }
}
const unknown = Object.keys(payload).filter(
  (k) => !REQUIRED.includes(k) && !OPTIONAL.includes(k),
);
if (unknown.length) {
  die(`unknown key(s) ${unknown.join(', ')} — a typo here would land silently in the data file`);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(payload.slug)) {
  die(`slug "${payload.slug}" is not kebab-case; it becomes a URL and a directory name`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
  die(`date "${payload.date}" must be YYYY-MM-DD`);
}
if (!Array.isArray(payload.tags) || payload.tags.length === 0) {
  die('tags must be a non-empty array');
}
if (!Array.isArray(payload.faq) || payload.faq.length < 3) {
  die(`faq must be an array of at least 3 items (got ${Array.isArray(payload.faq) ? payload.faq.length : typeof payload.faq}); it is what emits FAQPage schema`);
}
payload.faq.forEach((item, i) => {
  const miss = FAQ_KEYS.filter((k) => !item?.[k]);
  if (miss.length) die(`faq[${i}] is missing ${miss.join(', ')}`);
});
for (const k of ['bodyPl', 'bodyEn', 'bodyRu']) {
  if (String(payload[k]).length < 2000) {
    die(`${k} is only ${String(payload[k]).length} characters — the existing articles run ~20 000; this looks truncated`);
  }
}

const metaDescription = page.metaDescription ?? payload.summaryPl;
const ldDescription = page.ldDescription ?? metaDescription;
const keywords = Array.isArray(page.keywords) && page.keywords.length
  ? page.keywords : payload.tags;
if (metaDescription.length > 200) {
  die(`page.metaDescription is ${metaDescription.length} chars; keep it under ~160 so it is not truncated in search results`);
}

// -------------------------------------------------- read the data file once
let posts;
try {
  posts = JSON.parse(readFileSync(POSTS, 'utf8'));
} catch (e) {
  die(`cannot read ${POSTS}: ${e.message}`);
}
if (!Array.isArray(posts)) die('blog-posts.json is not an array — refusing to guess its shape');
if (posts.some((p) => p.slug === payload.slug)) {
  die(`slug "${payload.slug}" is already in blog-posts.json`);
}

const articleDir = join(ROOT, 'blog', payload.slug);
if (existsSync(articleDir)) {
  die(`blog/${payload.slug}/ already exists — refusing to overwrite a published article`);
}

// The template supplies everything that is the same on every article: fonts,
// favicons, the body shell, the author and publisher identities. Copying it
// from a real article rather than hardcoding means a change to the house head
// reaches new articles without touching this script.
const tplSlug = templateSlug ?? posts[posts.length - 1].slug;
const tplPath = join(ROOT, 'blog', tplSlug, 'index.html');
if (!existsSync(tplPath)) die(`template blog/${tplSlug}/index.html not found`);
const tpl = readFileSync(tplPath, 'utf8');

const titleAt = tpl.indexOf('    <title>');
const headEndAt = tpl.indexOf('  </head>');
if (titleAt === -1 || headEndAt === -1 || headEndAt < titleAt) {
  die(`template blog/${tplSlug}/index.html does not have the expected <title> ... </head> shape`);
}
const prefix = tpl.slice(0, titleAt);
const suffix = tpl.slice(headEndAt);

function pick(re, fallback) {
  const m = tpl.match(re);
  return m ? m[1] : fallback;
}
const ogImage = pick(/property="og:image" content="([^"]+)"/, `${SITE}/og-image.png`);
const siteName = pick(/property="og:site_name" content="([^"]+)"/, 'MiCode Sp. z o.o.');
const twSite = pick(/name="twitter:site" content="([^"]+)"/, '@micode_ai');
const twCreator = pick(/name="twitter:creator" content="([^"]+)"/, '@micode_ai');
const authorName = pick(/property="article:author" content="([^"]+)"/, 'Michał Peraviortkin');
let authorUrl = `${SITE}/`;
let publisher = { '@type': 'Organization', name: siteName, url: `${SITE}/` };
try {
  const ld = JSON.parse(tpl.slice(
    tpl.indexOf('<script type="application/ld+json">') + '<script type="application/ld+json">'.length,
    tpl.indexOf('</script>', tpl.indexOf('<script type="application/ld+json">')),
  ));
  const post = (Array.isArray(ld) ? ld : [ld]).find((n) => n['@type'] === 'BlogPosting');
  if (post?.author?.url) authorUrl = post.author.url;
  if (post?.publisher) publisher = post.publisher;
} catch {
  // Template LD unparseable: fall back to the constants above rather than
  // aborting — the generated page is still valid, just less inherited.
}

const url = `${SITE}/blog/${payload.slug}/`;
const jsonld = [
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: payload.titlePl,
    description: ldDescription,
    image: ogImage,
    datePublished: payload.date,
    dateModified: payload.date,
    url,
    inLanguage: 'pl',
    author: { '@type': 'Person', name: authorName, url: authorUrl },
    publisher,
    keywords,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MiCode', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      { '@type': 'ListItem', position: 3, name: payload.titlePl, item: url },
    ],
  },
  // Deliberately no FAQPage node here. ArticlePage.svelte already emits one
  // in-body so the static prerender bakes it per locale, and SEO.svelte
  // rewrites this head block at runtime — a second copy in the head would be
  // duplicate, conflicting schema, which is worse than none. The `faq` field
  // in the payload is what feeds that component; it is not unused.
];

const head = [
  `    <title>${htmlAttr(payload.titlePl)}</title>`,
  `    <meta name="description" content="${htmlAttr(metaDescription)}" />`,
  `    <link rel="canonical" href="${url}" />`,
  `    <meta property="og:title" content="${htmlAttr(payload.titlePl)}" />`,
  `    <meta property="og:description" content="${htmlAttr(metaDescription)}" />`,
  '    <meta property="og:type" content="article" />',
  `    <meta property="og:url" content="${url}" />`,
  `    <meta property="og:image" content="${ogImage}" />`,
  `    <meta property="og:site_name" content="${htmlAttr(siteName)}" />`,
  `    <meta property="article:published_time" content="${payload.date}" />`,
  `    <meta property="article:author" content="${htmlAttr(authorName)}" />`,
  ...payload.tags.map((t) => `    <meta property="article:tag" content="${htmlAttr(t)}" />`),
  `    <meta name="twitter:site" content="${twSite}" />`,
  `    <meta name="twitter:creator" content="${twCreator}" />`,
  '    <meta name="twitter:card" content="summary_large_image" />',
  `    <meta name="twitter:title" content="${htmlAttr(payload.titlePl)}" />`,
  `    <meta name="twitter:description" content="${htmlAttr(metaDescription)}" />`,
  `    <meta name="twitter:image" content="${ogImage}" />`,
  '    <script type="application/ld+json">',
  JSON.stringify(jsonld, null, 2).split('\n').map((l) => `    ${l}`).join('\n'),
  '    </script>',
  '',
].join('\n');

const indexHtml = prefix + head + suffix;
const mainTs = [
  "import '../../src/app.css';",
  "import ArticleApp from '../../src/ArticleApp.svelte';",
  "import { hydrate } from 'svelte';",
  '',
  'hydrate(ArticleApp, {',
  "  target: document.getElementById('app')!,",
  `  props: { slug: '${payload.slug}' }`,
  '});',
  '',
].join('\n');

// ------------------------------------------------------- vite.config.ts line
const viteKey = `${payload.slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())}Article`;
let vite = readFileSync(VITE, 'utf8');
if (vite.includes(`blog/${payload.slug}/index.html`)) {
  die(`vite.config.ts already has an input for blog/${payload.slug}/`);
}
if (new RegExp(`\\b${viteKey}\\s*:`).test(vite)) {
  die(`vite.config.ts already has an input named ${viteKey}`);
}
// Anchor on the last existing blog article input rather than on brace
// counting: the surrounding config has several nested objects, and inserting
// after a known sibling is the one placement that cannot land in the wrong one.
const lastInput = [...vite.matchAll(/^([ \t]*)([A-Za-z0-9_]+): resolve\(__dirname, "blog\/[^"]+\/index\.html"\),\r?\n/gm)].pop();
if (!lastInput) die('vite.config.ts has no blog article input to anchor the new one to');
const indent = lastInput[1];
const insertAt = lastInput.index + lastInput[0].length;
const viteLine = `${indent}${viteKey}: resolve(__dirname, "blog/${payload.slug}/index.html"),\n`;
vite = vite.slice(0, insertAt) + viteLine + vite.slice(insertAt);

// ------------------------------------------------------- public/llms.txt
// The curated map answer engines read. It is hand-maintained, not generated,
// so every article published without touching it goes missing from the one
// file whose whole job is telling an LLM what this site contains — three of
// eighteen were already absent when this step was added.
const LLMS = join(ROOT, 'public', 'llms.txt');
let llms = null;
let llmsLine = '';
if (existsSync(LLMS)) {
  const text = readFileSync(LLMS, 'utf8');
  if (!text.includes(`/blog/${payload.slug}/`)) {
    const lines = text.split('\n');
    const start = lines.findIndex((l) => l.trim() === '## Blog');
    if (start === -1) {
      console.error('add-blog-post: public/llms.txt has no "## Blog" section — skipping it');
    } else {
      let last = start;
      for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
        if (lines[i].startsWith('- [')) last = i;
      }
      const title = payload.metaTitleEn || payload.titleEn;
      const desc = (page.llmsDescription || payload.metaDescriptionEn
        || payload.summaryEn || '').replace(/\s+/g, ' ').trim();
      llmsLine = `- [${title}](${SITE}/blog/${payload.slug}/): ${desc}`;
      lines.splice(last + 1, 0, llmsLine);
      llms = lines.join('\n');
    }
  }
}

// ------------------------------------------------------------------- write
const nextPosts = JSON.stringify([...posts, payload], null, 2) + '\n';

if (dryRun) {
  console.log('add-blog-post: dry run, nothing written');
  console.log(`  slug          ${payload.slug}`);
  console.log(`  entries       ${posts.length} -> ${posts.length + 1}`);
  console.log(`  blog-posts    ${readFileSync(POSTS).length} -> ${Buffer.byteLength(nextPosts)} bytes`);
  console.log(`  index.html    ${Buffer.byteLength(indexHtml)} bytes (template: ${tplSlug})`);
  console.log(`  vite input    ${viteKey}`);
  console.log(`  faq questions ${payload.faq.length}`);
  console.log(`  llms.txt      ${llms ? 'one line appended' : 'unchanged (already listed, or no ## Blog section)'}`);
  process.exit(0);
}

function writeAtomic(path, contents) {
  const tmp = `${path}.tmp-add-blog-post`;
  writeFileSync(tmp, contents, 'utf8');
  renameSync(tmp, path);
}

mkdirSync(articleDir, { recursive: true });
writeFileSync(join(articleDir, 'index.html'), indexHtml, 'utf8');
writeFileSync(join(articleDir, 'main.ts'), mainTs, 'utf8');
writeAtomic(POSTS, nextPosts);
writeAtomic(VITE, vite);
if (llms !== null) writeAtomic(LLMS, llms);

console.log(`add-blog-post: registered ${payload.slug}`);
console.log(`  src/data/blog-posts.json   ${posts.length} -> ${posts.length + 1} entries`);
console.log(`  blog/${payload.slug}/index.html   ${Buffer.byteLength(indexHtml)} bytes`);
console.log(`  blog/${payload.slug}/main.ts`);
console.log(`  vite.config.ts             + ${viteKey}`);
if (llms !== null) console.log(`  public/llms.txt            + 1 line`);
console.log('  next: npm run build');
