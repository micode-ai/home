// Pure analysis of one grounded answer. No clock, no env, no ambient fetch —
// everything the functions need arrives as an argument, so the tests run offline
// and deterministically.

// Google hands back grounded sources as redirects through this host. Comparing
// our domain against such a URL would never match, so the host has to be
// resolved before any classification happens.
const REDIRECT_HOSTS = ['vertexaisearch.cloud.google.com'];

// A grounded chunk's title is usually the publisher's bare domain rather than a
// page title — verified against the live response captured in fixtures/. When it
// is shaped like a domain we trust it, because the alternative is one HEAD
// request per source and a weekly run sees a few hundred of them.
const DOMAIN_SHAPED = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

const bareHost = (value) => String(value).replace(/^www\./, '').toLowerCase();

export function extractText(response) {
  if (typeof response?.output_text === 'string') return response.output_text;
  return (response?.candidates ?? [])
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text ?? '')
    .filter(Boolean)
    .join('\n');
}

export function extractCitations(response) {
  const citations = [];
  const seen = new Set();
  const add = (url, title, domain) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    citations.push({ url, title: title ?? '', domain: domain ?? null });
  };

  // Shape A — classic generateContent.
  for (const candidate of response?.candidates ?? []) {
    for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
      if (chunk?.web) add(chunk.web.uri, chunk.web.title, chunk.web.domain);
    }
  }

  // Shape B — the interactions endpoint, where citations are text annotations.
  for (const step of response?.steps ?? []) {
    for (const content of step?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type === 'url_citation') add(annotation.url, annotation.title, null);
      }
    }
  }

  return citations;
}

export async function resolveHost(citation, fetchImpl) {
  let host;
  try {
    host = bareHost(new URL(citation.url).hostname);
  } catch {
    return 'unknown';
  }

  if (!REDIRECT_HOSTS.includes(host)) return host;
  if (citation.domain) return bareHost(citation.domain);

  const title = String(citation.title ?? '').trim();
  if (DOMAIN_SHAPED.test(title)) return bareHost(title);

  try {
    const response = await fetchImpl(citation.url, { method: 'HEAD', redirect: 'follow' });
    return bareHost(new URL(response.url).hostname);
  } catch {
    return 'unknown';
  }
}
