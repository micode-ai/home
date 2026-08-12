// Advice derived only from what a sweep measured. No clock, no network, no
// model: every line this file produces can be traced back to a number in the
// run object it was handed. That is the whole point — a suggestion nobody can
// check is worse than no suggestion.

const MAX_ADVICE = 5;
const MAX_PAGES = 2;
const MAX_LABEL = 70;
const MAX_LISTED = 2;
// A single citation is not a pattern. `1 против 0` used to qualify as a skew,
// and on live data that one citation was the accounting product page answering
// an accounting question — the portfolio working, not tilting.
const MIN_SKEW_SAMPLE = 3;

// Search aggregators and platforms are where answers get assembled, not rivals
// for the work. Calling Google a competitor would discredit the whole report.
const AGGREGATORS = new Set([
  'google.com', 'youtube.com', 'medium.com', 'amazon.com', 'microsoft.com',
  'linkedin.com', 'wikipedia.org', 'reddit.com', 'facebook.com', 'x.com',
  'twitter.com', 'quora.com', 'github.com', 'stackoverflow.com',
]);

const isAggregator = (host) => AGGREGATORS.has(host) || host.startsWith('google.');
const isRival = (host) => host !== 'unknown' && !isAggregator(host);

const bare = (value) => String(value).replace(/^www\./, '').toLowerCase();
const citedOnes = (run) => (run.results ?? []).filter((item) => item.status === 'cited');

// The report is read in Telegram, on a phone, by someone who has not opened the
// repository. `pl-koszt-agenta` tells them nothing; the question does.
const label = (id, questions) => {
  const question = questions?.[id];
  if (!question) return id;
  return question.length > MAX_LABEL ? `«${question.slice(0, MAX_LABEL - 1)}…»` : `«${question}»`;
};

const labelList = (ids, questions) => {
  const shown = ids.slice(0, MAX_LISTED).map((id) => label(id, questions)).join(', ');
  const rest = ids.length - MAX_LISTED;
  return rest > 0 ? `${shown} и ещё ${rest}` : shown;
};

const domainsOf = (result, field) =>
  [...new Set((result.attempts ?? []).flatMap((attempt) => attempt[field] ?? []))];

export function rivalCounts(run) {
  const counts = {};
  for (const item of run.results ?? []) {
    if (item.status === 'cited') continue;
    // Once per prompt, not once per mention: a page cited twice in one answer
    // is one competitor, not two.
    for (const domain of domainsOf(item, 'sourceDomains')) {
      if (!isRival(domain)) continue;
      counts[domain] = (counts[domain] ?? 0) + 1;
    }
  }
  return counts;
}

// `mentioned` and `absent` are different diseases and classify() goes to real
// trouble to keep them apart: absent means the engine never found us, mentioned
// means it named the brand and linked somewhere else. One line for both would
// point half its readers at the wrong remedy.
function brandCanary(run, questions) {
  const brand = (run.results ?? []).filter((item) => item.kind === 'brand');
  const absent = brand.filter((item) => item.status === 'absent');
  const mentioned = brand.filter((item) => item.status === 'mentioned');
  const out = [];

  if (absent.length) {
    out.push({
      rule: 'brand-canary',
      priority: 1,
      text: `Бренд не находит нас: ${labelList(absent.map((item) => item.id), questions)} — это индексация, а не маркетинг`,
    });
  }
  if (mentioned.length) {
    out.push({
      rule: 'brand-mentioned-not-cited',
      priority: 1,
      text: `Бренд называют, но не ссылаются: ${labelList(mentioned.map((item) => item.id), questions)} — это ссылки, а не индексация`,
    });
  }
  return out;
}

function pageNotCited(run, questions) {
  const out = [];
  for (const item of run.results ?? []) {
    if (out.length >= MAX_PAGES) break;
    if (item.kind !== 'category' || item.status === 'cited' || !item.target) continue;
    const rivals = domainsOf(item, 'sourceDomains').filter(isRival).slice(0, 2);
    out.push({
      rule: 'page-not-cited',
      priority: 2,
      text: rivals.length
        ? `${label(item.id, questions)}: страница под запрос есть (${item.target}), но цитируют ${rivals.join(', ')}`
        : `${label(item.id, questions)}: страница под запрос есть (${item.target}), но её не цитируют`,
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

  // A skew is a shape in the data, and two points cannot draw one: below
  // MIN_SKEW_SAMPLE this rule was reporting a single product-page citation as a
  // portfolio problem.
  if (secondary < MIN_SKEW_SAMPLE || secondary <= primary || !others.size) return [];
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

function volatile(run, questions) {
  const flapping = (run.results ?? []).filter((item) => {
    const statuses = new Set((item.attempts ?? []).map((attempt) => attempt.status));
    return statuses.has('cited') && statuses.size > 1;
  });
  if (!flapping.length) return [];
  return [{
    rule: 'volatile',
    priority: 5,
    text: `На грани, повторы расходятся: ${labelList(flapping.map((item) => item.id), questions)} — запрос почти берётся`,
  }];
}

// There was a `persistent-rival` rule here (priority 6). It restated, by
// construction, the first entry of the report's own "Цитируют вместо нас" line
// two rows above it — one of five advice slots spent on a repeat. rivalCounts
// stays exported because report.mjs still renders that header line.
export function buildAdvice(run, domain, questions) {
  return [
    ...brandCanary(run, questions),
    ...pageNotCited(run, questions),
    ...portfolioSkew(run, domain),
    ...deadLanguage(run),
    ...volatile(run, questions),
  ]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_ADVICE);
}
