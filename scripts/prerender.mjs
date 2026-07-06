import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const products = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf8'));
const blogPosts = JSON.parse(readFileSync(join(root, 'src/data/blog-posts.json'), 'utf8'));
const homeMeta = JSON.parse(readFileSync(join(root, 'src/data/seo-home.json'), 'utf8'));

const SITE = 'https://mi-code.pl/';
const LOCALES = ['pl', 'en', 'ru'];
const OG_LOCALE = { pl: 'pl_PL', en: 'en_US', ru: 'ru_RU' };

// Absolute canonical URL for a route (urlPath is '' for home, or e.g. 'products/x/')
// in a given locale. Polish lives at the root; en/ru live under /en/ and /ru/.
function canonicalFor(urlPath, lang) {
  return SITE + (lang === 'pl' ? '' : `${lang}/`) + urlPath;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Set (or add) the lang attribute on the <html> element.
function setHtmlLang(html, lang) {
  if (/<html\b[^>]*\slang="[^"]*"/.test(html)) {
    return html.replace(/(<html\b[^>]*?)\slang="[^"]*"/, `$1 lang="${lang}"`);
  }
  return html.replace(/<html\b/, `<html lang="${lang}"`);
}

// Replace the canonical/hreflang/og:url/og:locale for this route + locale.
// Strips any existing equivalents first so nothing is duplicated.
function injectSeo(html, urlPath, lang) {
  html = html
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '')
    .replace(/\s*<meta property="og:url"[^>]*>/g, '')
    .replace(/\s*<meta property="og:locale"[^>]*>/g, '');

  const canonical = canonicalFor(urlPath, lang);
  const lines = [
    `<link rel="canonical" href="${canonical}" />`,
    ...LOCALES.map(
      (l) => `<link rel="alternate" hreflang="${l}" href="${canonicalFor(urlPath, l)}" />`
    ),
    `<link rel="alternate" hreflang="x-default" href="${canonicalFor(urlPath, 'pl')}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
  ];
  return html.replace('</head>', `    ${lines.join('\n    ')}\n  </head>`);
}

// Localize the <title> / description / OG / Twitter text for the home page.
function localizeHomeMeta(html, lang) {
  const m = homeMeta[lang];
  if (!m) return html;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(m.title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${escapeAttr(m.description)}$2`
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${escapeAttr(m.ogTitle)}$2`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${escapeAttr(m.ogDescription)}$2`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${escapeAttr(m.ogTitle)}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${escapeAttr(m.ogDescription)}$2`
    );
}

// Render every locale variant of one route from the built (Polish) client shell.
function processRoute({ distRoute, urlPath, render }) {
  const templatePath = join(root, 'dist', distRoute);
  const template = readFileSync(templatePath, 'utf8');
  const marker = '<div id="app"></div>';
  if (!template.includes(marker)) {
    throw new Error(`Could not find ${marker} in ${distRoute}`);
  }

  for (const lang of LOCALES) {
    const appHtml = render(lang).html;
    let html = template.replace(marker, `<div id="app">${appHtml}</div>`);
    html = setHtmlLang(html, lang);
    html = injectSeo(html, urlPath, lang);
    if (urlPath === '') html = localizeHomeMeta(html, lang);

    const outRel = lang === 'pl' ? distRoute : join(lang, distRoute);
    const outPath = join(root, 'dist', outRel);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    console.log(`  ${outRel.replace(/\\/g, '/')} (${appHtml.length} chars)`);
  }
}

// Build a localized sitemap: one <url> per (route, locale) with hreflang
// alternates. Written to both dist/ (deployed) and public/ (source of truth).
function generateSitemap(routes) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = [];
  for (const route of routes) {
    for (const lang of LOCALES) {
      const alternates = [
        ...LOCALES.map(
          (l) =>
            `      <xhtml:link rel="alternate" hreflang="${l}" href="${canonicalFor(route.urlPath, l)}" />`
        ),
        `      <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalFor(route.urlPath, 'pl')}" />`,
      ].join('\n');
      entries.push(
        `  <url>\n` +
          `    <loc>${canonicalFor(route.urlPath, lang)}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${route.changefreq}</changefreq>\n` +
          `    <priority>${route.priority}</priority>\n` +
          `${alternates}\n` +
          `  </url>`
      );
    }
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n` +
    entries.join('\n\n') +
    `\n\n</urlset>\n`;

  writeFileSync(join(root, 'dist/sitemap.xml'), xml);
  writeFileSync(join(root, 'public/sitemap.xml'), xml);
  console.log(`  sitemap.xml (${routes.length * LOCALES.length} URLs)`);
}

async function run() {
  const { renderPage: renderHome } = await import('../dist-ssr/home.js');
  const { renderPage: renderProduct } = await import('../dist-ssr/product.js');
  const { renderPage: renderBlog } = await import('../dist-ssr/blog.js');
  const { renderPage: renderArticle } = await import('../dist-ssr/article.js');

  const routes = [
    { distRoute: 'index.html', urlPath: '', priority: '1.0', changefreq: 'monthly', render: (l) => renderHome(l) },
    ...products.map((p) => ({
      distRoute: `products/${p.id}/index.html`,
      urlPath: `products/${p.id}/`,
      priority: '0.8',
      changefreq: 'monthly',
      render: (l) => renderProduct(p.id, l),
    })),
    { distRoute: 'blog/index.html', urlPath: 'blog/', priority: '0.7', changefreq: 'weekly', render: (l) => renderBlog(l) },
    ...blogPosts.map((post) => ({
      distRoute: `blog/${post.slug}/index.html`,
      urlPath: `blog/${post.slug}/`,
      priority: '0.6',
      changefreq: 'monthly',
      render: (l) => renderArticle(post.slug, l),
    })),
  ];

  console.log('Prerendering all routes (pl/en/ru)...');
  for (const route of routes) {
    processRoute(route);
  }

  console.log('Generating localized sitemap...');
  generateSitemap(routes);

  console.log('Prerendering complete.');
}

run().catch((err) => {
  console.error('Prerendering failed:', err);
  process.exit(1);
});
