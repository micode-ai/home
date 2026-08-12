// Advice derived only from what a sweep measured. No clock, no network, no
// model: every line this file produces can be traced back to a number in the
// run object it was handed. That is the whole point — a suggestion nobody can
// check is worse than no suggestion.

const MAX_ADVICE = 5;
const MAX_PAGES = 2;
const RIVAL_THRESHOLD = 3;

const bare = (value) => String(value).replace(/^www\./, '').toLowerCase();
const citedOnes = (run) => (run.results ?? []).filter((item) => item.status === 'cited');

const domainsOf = (result, field) =>
  [...new Set((result.attempts ?? []).flatMap((attempt) => attempt[field] ?? []))];

export function rivalCounts(run) {
  const counts = {};
  for (const item of run.results ?? []) {
    if (item.status === 'cited') continue;
    // Once per prompt, not once per mention: a page cited twice in one answer
    // is one competitor, not two.
    for (const domain of domainsOf(item, 'sourceDomains')) {
      counts[domain] = (counts[domain] ?? 0) + 1;
    }
  }
  return counts;
}

function brandCanary(run) {
  const missing = (run.results ?? []).filter(
    (item) => item.kind === 'brand' && item.status !== 'cited',
  );
  if (!missing.length) return [];
  return [{
    rule: 'brand-canary',
    priority: 1,
    text: `Бренд не находит нас: ${missing.map((item) => item.id).join(', ')} — это индексация, а не маркетинг`,
  }];
}

function pageNotCited(run) {
  const out = [];
  for (const item of run.results ?? []) {
    if (out.length >= MAX_PAGES) break;
    if (item.kind !== 'category' || item.status === 'cited' || !item.target) continue;
    const rivals = domainsOf(item, 'sourceDomains').filter((d) => d !== 'unknown').slice(0, 2);
    out.push({
      rule: 'page-not-cited',
      priority: 2,
      text: rivals.length
        ? `${item.id}: страница под запрос есть (${item.target}), но цитируют ${rivals.join(', ')}`
        : `${item.id}: страница под запрос есть (${item.target}), но её не цитируют`,
    });
  }
  return out;
}

function portfolioSkew(run, domain) {
  const target = bare(domain);
  const isPrimary = (host) => host === target || host.endsWith(`.${target}`);
  const others = new Set();
  let primary = 0;
  let secondary = 0;

  for (const item of citedOnes(run)) {
    const domains = domainsOf(item, 'citedDomains').map(bare);
    if (domains.some(isPrimary)) {
      primary += 1;
      continue;
    }
    secondary += 1;
    for (const host of domains) others.add(host);
  }

  if (secondary <= primary || !others.size) return [];
  return [{
    rule: 'portfolio-skew',
    priority: 3,
    text: `Находят через ${[...others].sort().join(', ')}, а не через ${domain} (${secondary} против ${primary})`,
  }];
}

function deadLanguage(run) {
  const byLang = {};
  for (const item of run.results ?? []) {
    const bucket = (byLang[item.lang] ??= { total: 0, cited: 0 });
    bucket.total += 1;
    if (item.status === 'cited') bucket.cited += 1;
  }
  return Object.entries(byLang)
    .filter(([, bucket]) => bucket.cited === 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lang, bucket]) => ({
      rule: 'dead-language',
      priority: 4,
      text: `${lang}: 0 из ${bucket.total} — ни один запрос на этом языке нас не находит`,
    }));
}

function volatile(run) {
  const flapping = (run.results ?? []).filter((item) => {
    const statuses = new Set((item.attempts ?? []).map((attempt) => attempt.status));
    return statuses.has('cited') && statuses.size > 1;
  });
  if (!flapping.length) return [];
  return [{
    rule: 'volatile',
    priority: 5,
    text: `На грани, повторы расходятся: ${flapping.map((item) => item.id).join(', ')} — запрос почти берётся`,
  }];
}

function persistentRival(run) {
  const strong = Object.entries(rivalCounts(run))
    .filter(([domain, count]) => domain !== 'unknown' && count >= RIVAL_THRESHOLD)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!strong.length) return [];
  const [domain, count] = strong[0];
  return [{
    rule: 'persistent-rival',
    priority: 6,
    text: `${domain} цитируют в ${count} запросах, где нас нет — постоянный конкурент`,
  }];
}

export function buildAdvice(run, domain) {
  return [
    ...brandCanary(run),
    ...pageNotCited(run),
    ...portfolioSkew(run, domain),
    ...deadLanguage(run),
    ...volatile(run),
    ...persistentRival(run),
  ]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_ADVICE);
}
