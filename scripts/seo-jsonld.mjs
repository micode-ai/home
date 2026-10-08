// Per-locale rewriting of the JSON-LD hand-written into each page's index.html <head>.
//
// Those blocks are authored once (in Polish for articles, in English for products) and
// prerender.mjs copies the same <head> into /, /en/ and /ru/. Without this pass the /en/ and
// /ru/ copies tell crawlers that the page is Polish, at the Polish URL, under the Polish
// headline — and answer engines that read only the static HTML treat them as duplicates.

const SITE = 'https://mi-code.pl/';

const LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

// Nodes describing the company or the whole site keep their canonical (root) URLs on every
// locale: the organisation does not move to /en/ when the page does.
const SITE_WIDE_TYPES = new Set(['Organization', 'ProfessionalService', 'Person', 'WebSite']);

function typesOf(node) {
  return [].concat(node?.['@type'] ?? []);
}

// https://mi-code.pl/blog/x/ -> https://mi-code.pl/en/blog/x/ for lang 'en'. Polish lives at the
// root, so it is returned as is, as are foreign URLs, already-localized ones and files (images).
export function localizeSiteUrl(url, lang) {
  if (lang === 'pl' || typeof url !== 'string' || !url.startsWith(SITE)) return url;
  const rest = url.slice(SITE.length);
  if (/^(pl|en|ru)\//.test(rest)) return url;
  if (/\.[a-z0-9]+$/i.test(rest.split(/[?#]/)[0])) return url;
  return SITE + lang + '/' + rest;
}

// Point page URLs (url / item / @id) at the locale and set a scalar inLanguage to it. A list
// inLanguage (["pl","en","ru"]) already describes every locale and is left alone.
export function localizeNode(node, lang) {
  if (Array.isArray(node)) return node.map((n) => localizeNode(n, lang));
  if (!node || typeof node !== 'object') return node;
  if (typesOf(node).some((t) => SITE_WIDE_TYPES.has(t))) return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if ((key === 'url' || key === 'item' || key === '@id') && typeof value === 'string') {
      out[key] = localizeSiteUrl(value, lang);
    } else if (key === 'inLanguage' && typeof value === 'string') {
      out[key] = lang;
    } else {
      out[key] = localizeNode(value, lang);
    }
  }
  return out;
}

// Every @type declared by JSON-LD anywhere in `html`.
export function jsonLdTypes(html) {
  const types = new Set();
  for (const [, json] of html.matchAll(LD_RE)) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      continue;
    }
    for (const node of [].concat(data)) typesOf(node).forEach((t) => types.add(t));
  }
  return types;
}

function serialize(data) {
  // Escape `<` so the JSON can never break out of the surrounding <script> element.
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

// Rewrite the JSON-LD in the <head> of `html` for `lang`:
//   - drop nodes whose @type is in `drop` (the rendered body already emits a localized copy);
//   - localize URLs and inLanguage (localizeNode);
//   - hand each remaining node to `edit(node)` for page-specific text (headline, name, dates).
// Body JSON-LD is never touched. A block that fails to parse is kept verbatim.
export function localizeHeadJsonLd(html, { lang, drop = new Set(), edit } = {}) {
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) return html;
  const head = html.slice(0, headEnd).replace(LD_RE, (whole, json) => {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      return whole;
    }
    const isList = Array.isArray(data);
    let nodes = (isList ? data : [data]).filter((n) => !typesOf(n).some((t) => drop.has(t)));
    if (nodes.length === 0) return '';
    nodes = nodes.map((n) => localizeNode(n, lang));
    if (edit) nodes.forEach((n) => edit(n));
    return `<script type="application/ld+json">\n${serialize(isList ? nodes : nodes[0])}\n</script>`;
  });
  return head + html.slice(headEnd);
}
