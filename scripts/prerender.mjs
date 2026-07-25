import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const products = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf8'));
const blogPosts = JSON.parse(readFileSync(join(root, 'src/data/blog-posts.json'), 'utf8'));
const homeMeta = JSON.parse(readFileSync(join(root, 'src/data/seo-home.json'), 'utf8'));

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

// Inline script (Polish home only) that redirects a returning visitor to their
// remembered language before hydration. Crawlers have empty localStorage, so
// they see Polish at `/` and index it normally.
const LANGUAGE_REDIRECT_SCRIPT =
  `<script>(function(){try{var l=localStorage.getItem('micode_language');` +
  `if(l==='en'||l==='ru'){location.replace('/'+l+'/'+location.search+location.hash);}}catch(e){}})();</script>`;

function injectLanguageRedirect(html) {
  return html.replace('</head>', `    ${LANGUAGE_REDIRECT_SCRIPT}\n  </head>`);
}

// Replace the <title>/description and matching OG/Twitter tags. `meta` may
// provide `ogTitle`/`ogDescription`; otherwise title/description are reused.
// Missing tags are simply skipped (regex no-op), so it is safe on any page.
function replaceMeta(html, meta) {
  const title = meta.title;
  const description = meta.description;
  const ogTitle = meta.ogTitle ?? title;
  const ogDescription = meta.ogDescription ?? description;

  if (title != null) {
    const escTitle = escapeAttr(title);
    const escOgTitle = escapeAttr(ogTitle);
    html = html
      .replace(/<title>[^<]*<\/title>/, () => `<title>${escTitle}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + escOgTitle + b)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (_, a, b) => a + escOgTitle + b);
  }
  if (description != null) {
    const escDescription = escapeAttr(description);
    const escOgDescription = escapeAttr(ogDescription);
    html = html
      .replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + escDescription + b)
      .replace(
        /(<meta property="og:description" content=")[^"]*(")/,
        (_, a, b) => a + escOgDescription + b
      )
      .replace(
        /(<meta name="twitter:description" content=")[^"]*(")/,
        (_, a, b) => a + escOgDescription + b
      );
  }
  return html;
}

// Render every locale variant of one route from the built (Polish) client shell.
function processRoute({ distRoute, urlPath, render, metaFor }) {
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
    const meta = metaFor ? metaFor(lang) : null;
    if (meta) html = replaceMeta(html, meta);
    if (urlPath === '' && lang === 'pl') html = injectLanguageRedirect(html);

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
  const { renderPage: renderPrivacyPolicy } = await import('../dist-ssr/privacyPolicy.js');

  // metaFor(lang) returns localized {title, description, ...} to inject, or null
  // to keep the page's static (Polish) meta. Polish variants return null since
  // their static index.html meta is already correct/bespoke.
  const suffix = (l) => (l === 'en' ? 'En' : 'Ru'); // blog-posts.json field suffix

  const routes = [
    {
      distRoute: 'index.html',
      urlPath: '',
      priority: '1.0',
      changefreq: 'monthly',
      render: (l) => renderHome(l),
      metaFor: (l) =>
        homeMeta[l]
          ? {
              title: homeMeta[l].title,
              description: homeMeta[l].description,
              ogTitle: homeMeta[l].ogTitle,
              ogDescription: homeMeta[l].ogDescription,
            }
          : null,
    },
    ...products.map((p) => ({
      distRoute: `products/${p.id}/index.html`,
      urlPath: `products/${p.id}/`,
      priority: '0.8',
      changefreq: 'monthly',
      render: (l) => renderProduct(p.id, l),
      metaFor: (l) =>
        l === 'pl'
          ? null
          : { title: `${t(p.nameKey, l)} — MiCode`, description: t(p.descriptionKey, l) },
    })),
    {
      distRoute: 'blog/index.html',
      urlPath: 'blog/',
      priority: '0.7',
      changefreq: 'weekly',
      render: (l) => renderBlog(l),
      metaFor: (l) => (l === 'pl' ? null : { title: `${t('blog.title', l)} — MiCode` }),
    },
    ...blogPosts.map((post) => ({
      distRoute: `blog/${post.slug}/index.html`,
      urlPath: `blog/${post.slug}/`,
      priority: '0.6',
      changefreq: 'monthly',
      render: (l) => renderArticle(post.slug, l),
      // Prefer an explicit SERP-length meta override (metaTitle*/metaDescription*) when a
      // post defines one — falls back to the full title/summary otherwise. The visible H1
      // (title*) and card summary (summary*) are never touched by this.
      metaFor: (l) =>
        l === 'pl'
          ? null
          : {
              title: post[`metaTitle${suffix(l)}`] ?? post[`title${suffix(l)}`],
              description: post[`metaDescription${suffix(l)}`] ?? post[`summary${suffix(l)}`],
            },
    })),
    {
      distRoute: 'privacy-policy/index.html',
      urlPath: 'privacy-policy/',
      priority: '0.3',
      changefreq: 'yearly',
      render: (l) => renderPrivacyPolicy(l),
      metaFor: (l) => {
        if (l === 'pl') return null;
        const descriptions = {
          en: "MiCode's privacy policy: what data we collect, the legal basis, how long we keep it, and your rights under GDPR.",
          ru: 'Политика конфиденциальности MiCode: какие данные мы собираем, на каком основании, как долго храним и какие у вас права по GDPR.',
        };
        return {
          title: `${t('legal.privacyPolicy.title', l)} — MiCode`,
          description: descriptions[l],
        };
      },
    },
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
