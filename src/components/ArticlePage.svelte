<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import { track } from '../services/tracking';
  import blogPosts from '../data/blog-posts.json';
  import products from '../data/products.json';
  import MermaidDiagram from './MermaidDiagram.svelte';
  import CostCalculator from './CostCalculator.svelte';
  import { articleDiagrams } from '../data/article-diagrams';
  import { articleTables, type ArticleTable } from '../data/article-tables';
  import { estimateReadingMinutes } from '../services/readingTime';
  import ShareButtons from './ShareButtons.svelte';
  import { getRelatedPosts } from '../services/relatedArticles';
  import { buildToc } from '../services/articleToc';
  import { computeReadingProgress } from '../services/readingProgress';
  import { annotateGlossary, type GlossaryEntry, type GlossaryPart } from '../services/glossaryTerms';
  import glossary from '../data/glossary.json';
  import GlossaryTerm from './GlossaryTerm.svelte';

  // Built once at module scope — glossary.json is static data, not per-render.
  const glossaryById = Object.fromEntries((glossary as GlossaryEntry[]).map((e) => [e.id, e]));

  type Post = typeof blogPosts[number];

  let { slug }: { slug: string } = $props();

  const post = $derived(blogPosts.find((p) => p.slug === slug) as Post | undefined);
  const lang = $derived($languageStore);

  // Same "published" gate as `BlogListing.svelte`'s `publishedPosts` — a future-dated post stays
  // directly reachable by URL, but never gets recommended from another post's page.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const publishedPosts = blogPosts
    .filter((p) => p.date <= todayStr)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const relatedPosts = $derived(post ? getRelatedPosts(publishedPosts, post, 3) : []);

  function relatedTitle(p: Post, l: string): string {
    if (l === 'pl') return p.titlePl;
    if (l === 'ru') return p.titleRu;
    return p.titleEn;
  }

  function relatedSummary(p: Post, l: string): string {
    if (l === 'pl') return p.summaryPl;
    if (l === 'ru') return p.summaryRu;
    return p.summaryEn;
  }

  const relatedArticlesLabel = $derived(t('blog.relatedArticles', lang));
  const readArticleLabel = $derived(t('blog.readArticle', lang));

  const title = $derived(post
    ? (lang === 'pl' ? post.titlePl : lang === 'ru' ? post.titleRu : post.titleEn)
    : '');
  const body = $derived(post
    ? (lang === 'pl' ? (post as any).bodyPl : lang === 'ru' ? (post as any).bodyRu : (post as any).bodyEn) ?? ''
    : '');

  // Body is authored as `\n\n`-separated chunks. Most chunks are plain paragraphs; a few opt into
  // light markup: `## heading`, `> callout`, and `[[diagram:id|caption]]` (renders a Mermaid figure).
  // Inline `**bold**` and `*italic*` are supported inside paragraphs/callouts. Plain-prose posts are unaffected.
  type Seg = { t: string; b: boolean; i: boolean; href?: string; glossaryParts?: GlossaryPart[] };
  // `RawBlock` is what the split/regex pass below produces — an `h2` has heading text but no id
  // yet, since ids are derived from *all* headings in the article at once (see `tocHeadings`).
  // `Block` is the final per-render shape used by the template, with that id filled in.
  type RawBlock =
    | { kind: 'p'; segments: Seg[] }
    | { kind: 'h2'; text: string }
    | { kind: 'callout'; segments: Seg[] }
    | { kind: 'diagram'; id: string; caption: string }
    | { kind: 'table'; id: string }
    | { kind: 'widget'; id: string };
  type Block =
    | { kind: 'p'; segments: Seg[] }
    | { kind: 'h2'; text: string; id: string }
    | { kind: 'callout'; segments: Seg[] }
    | { kind: 'diagram'; id: string; caption: string }
    | { kind: 'table'; id: string }
    | { kind: 'widget'; id: string };

  const DIAGRAM_RE = /^\[\[diagram:([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/i;
  const TABLE_RE = /^\[\[table:([a-z0-9-]+)\]\]$/i;
  const WIDGET_RE = /^\[\[widget:([a-z0-9-]+)\]\]$/i;

  // `[text](url)` in prose and callouts, rendered as an external link. Only http(s) URLs match,
  // so an authored `javascript:`/`data:` target stays inert text rather than becoming a link.
  // Article bodies live in blog-posts.json, but they are still authored content passing through
  // a renderer, so the scheme allowlist is the guard rather than trust in the source file.
  const LINK_RE = /\[([^\][]+)\]\((https?:\/\/[^\s)]+)\)/g;

  // `**bold**` is parsed first; within each non-bold run, single `*italic*` is parsed. The two
  // never nest in authored content, so treating them independently is sufficient.
  function emphasisSegments(text: string): Seg[] {
    const out: Seg[] = [];
    text.split('**').forEach((part, bi) => {
      if (bi % 2 === 1) {
        out.push({ t: part, b: true, i: false });
      } else {
        part.split('*').forEach((sub, si) => {
          if (sub === '') return;
          out.push({ t: sub, b: false, i: si % 2 === 1 });
        });
      }
    });
    return out;
  }

  // Links are split out before emphasis, so link text is always plain — `**bold**` inside a
  // link label is not supported and none of the authored content needs it.
  function inlineSegments(text: string): Seg[] {
    const out: Seg[] = [];
    let cursor = 0;
    for (const match of text.matchAll(LINK_RE)) {
      const start = match.index ?? 0;
      if (start > cursor) out.push(...emphasisSegments(text.slice(cursor, start)));
      out.push({ t: match[1], b: false, i: false, href: match[2] });
      cursor = start + match[0].length;
    }
    if (cursor < text.length) out.push(...emphasisSegments(text.slice(cursor)));
    return out;
  }

  // Diagrams are authored per language; fall back to Russian if a language is missing.
  function diagramDef(id: string, l: string): string | undefined {
    const entry = (articleDiagrams as Record<string, Record<string, string>>)[id];
    if (!entry) return undefined;
    return entry[l] ?? entry.ru;
  }

  // Tables are authored per language; fall back to Russian if a language is missing.
  function tableDef(id: string, l: string): ArticleTable | undefined {
    const entry = (articleTables as Record<string, Record<string, ArticleTable>>)[id];
    if (!entry) return undefined;
    return entry[l] ?? entry.ru;
  }

  const rawBlocks = $derived.by<RawBlock[]>(() => {
    if (!body) return [];
    return body.split('\n\n').map((chunk: string): RawBlock => {
      const c = chunk.trim();
      const dm = c.match(DIAGRAM_RE);
      if (dm) return { kind: 'diagram', id: dm[1], caption: (dm[2] ?? '').trim() };
      const tm = c.match(TABLE_RE);
      if (tm) return { kind: 'table', id: tm[1] };
      const wm = c.match(WIDGET_RE);
      if (wm) return { kind: 'widget', id: wm[1] };
      if (c.startsWith('## ')) return { kind: 'h2', text: c.slice(3).trim() };
      if (c.startsWith('> ')) return { kind: 'callout', segments: inlineSegments(c.replace(/^> ?/gm, '').trim()) };
      return { kind: 'p', segments: inlineSegments(chunk) };
    });
  });

  // "On this page" entries — one per `h2` block, in document order. A heading with no
  // Latin/digit characters (e.g. an all-Cyrillic Russian heading) still gets a stable
  // `section-N` id from `buildToc`; see docs/contracts/blog-article-table-of-contents.md.
  const tocHeadings = $derived.by(() =>
    buildToc(rawBlocks.filter((b): b is Extract<RawBlock, { kind: 'h2' }> => b.kind === 'h2').map((b) => b.text))
  );
  const showToc = $derived(tocHeadings.length >= 3);
  const tocLabel = $derived(t('blog.tableOfContents', lang));

  // Reading-progress bar. Gated behind `showToc` — the same "long article" threshold, not a
  // second heuristic; see docs/contracts/blog-reading-progress-bar.md.
  let articleBodyEl: HTMLElement | undefined = $state();
  let readingProgress = $state(0);

  function updateReadingProgress() {
    if (!articleBodyEl) return;
    const rect = articleBodyEl.getBoundingClientRect();
    readingProgress = computeReadingProgress(rect.top, rect.height, window.innerHeight);
    reportScrollDepth();
  }

  // Ascending, so a jump to the end reports the thresholds in the order they were passed.
  const SCROLL_DEPTHS = [25, 50, 75, 90];
  const reportedDepths = new Set<number>();

  function reportScrollDepth() {
    for (const depth of SCROLL_DEPTHS) {
      if (readingProgress < depth || reportedDepths.has(depth)) continue;
      reportedDepths.add(depth);
      track('scroll', { percent_scrolled: depth, slug });
    }
  }

  onMount(() => {
    updateReadingProgress();
  });

  const blocks = $derived.by<Block[]>(() => {
    let h2Index = 0;
    return rawBlocks.map((b): Block => (b.kind === 'h2' ? { ...b, id: tocHeadings[h2Index++].id } : b));
  });

  // First-occurrence glossary annotation, scoped to plain (non-bold/italic/link) segments of `p`
  // and `callout` blocks only. One `seen` set per computation, so "first occurrence" resets per
  // article render (and per language switch, since that recomputes `blocks`); see
  // docs/contracts/blog-jargon-glossary-tooltips.md.
  const blocksWithGlossary = $derived.by<Block[]>(() => {
    const seen = new Set<string>();
    return blocks.map((b): Block => {
      if (b.kind !== 'p' && b.kind !== 'callout') return b;
      return {
        ...b,
        segments: b.segments.map((seg): Seg =>
          seg.b || seg.i || seg.href
            ? seg
            : { ...seg, glossaryParts: annotateGlossary(seg.t, glossary as GlossaryEntry[], seen) }
        ),
      };
    });
  });
  const shareUrl = $derived(typeof window !== 'undefined' ? window.location.href : '');
  const backLabel = $derived(t('blog.backToMicode', lang));
  const blogLabel = $derived(t('blog.title', lang));
  const readingTimeLabel = $derived(
    t('blog.readingTime', lang).replace('{min}', String(estimateReadingMinutes(body)))
  );

  const tableSuffix = $derived(lang === 'pl' ? 'Pl' : lang === 'ru' ? 'Ru' : 'En');
  const aiModelsTable = $derived((post as any)?.aiModelsTable as
    | { modelHeader: string; rows: Record<string, string>[]; [key: string]: any }
    | undefined);

  const relatedProductSlug = $derived((post as any)?.relatedProductSlug as string | undefined);
  const relatedProduct = $derived(relatedProductSlug
    ? products.find(p => p.id === relatedProductSlug)
    : undefined);
  const relatedLabel = $derived(
    lang === 'pl' ? 'Zobacz powiązany produkt'
    : lang === 'ru' ? 'Посмотреть связанный продукт'
    : 'See related product'
  );

  const AUTHOR_NAME = 'Michał Peraviortkin';
  const AUTHOR_URL = 'https://www.linkedin.com/in/mikhailperaviortkin/';
  const authorTitle = $derived(
    lang === 'pl' ? 'Założyciel i CEO'
    : lang === 'ru' ? 'Основатель и CEO'
    : 'Founder & CEO'
  );

  // FAQ (optional). Authored inline per language on the post as
  // `faq: [{ qPl, qEn, qRu, aPl, aEn, aRu }]`. Rendered both as a visible section and as
  // FAQPage JSON-LD emitted in-body, so the static prerender bakes it per locale (JSON-LD is
  // valid anywhere in the document). Powers Answer-Engine Optimization (AEO).
  type FaqItem = { q: string; a: string };
  const faqItems = $derived.by<FaqItem[]>(() => {
    const raw = (post as any)?.faq as Array<Record<string, string>> | undefined;
    if (!Array.isArray(raw)) return [];
    const qk = 'q' + tableSuffix;
    const ak = 'a' + tableSuffix;
    return raw
      .map((it) => ({ q: (it[qk] ?? '').trim(), a: (it[ak] ?? '').trim() }))
      .filter((it) => it.q && it.a);
  });
  const faqLabel = $derived(
    lang === 'pl' ? 'Najczęstsze pytania'
    : lang === 'ru' ? 'Частые вопросы'
    : 'Frequently asked questions'
  );
  const faqJsonLd = $derived.by<string>(() => {
    if (faqItems.length === 0) return '';
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    };
    // Escape `<` so the JSON can never break out of the surrounding <script> element.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    return `<script type="application/ld+json">${json}<\/script>`;
  });
</script>

<svelte:window onscroll={updateReadingProgress} onresize={updateReadingProgress} />

{#if post}
<article class="article-page" aria-labelledby="article-title">
  {#if showToc}
    <div class="reading-progress-bar" style="width: {readingProgress}%" aria-hidden="true"></div>
  {/if}
  <div class="article-hero">
    <div class="article-inner">
      <nav class="article-breadcrumb" aria-label="Breadcrumb">
        <a href={withLocale('/', lang)}>{t('header.companyName', lang)}</a>
        <span aria-hidden="true">›</span>
        <a href={withLocale('/blog/', lang)}>{blogLabel}</a>
      </nav>
      <h1 id="article-title" class="article-title">{title}</h1>
      <p class="article-byline">
        <a href={AUTHOR_URL} target="_blank" rel="author noopener noreferrer">{AUTHOR_NAME}</a>
        <span aria-hidden="true"> — </span>{authorTitle}
      </p>
      <time class="article-date" datetime={post.date}>{post.date}</time>
      <span class="article-meta-sep" aria-hidden="true"> · </span>
      <span class="article-reading-time">{readingTimeLabel}</span>
      <div class="article-tags">
        {#each post.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      <ShareButtons url={shareUrl} {title} {lang} />
    </div>
  </div>
  <div class="article-body" bind:this={articleBodyEl}>
    <div class="article-inner">
      {#if showToc}
        <nav class="article-toc" aria-label={tocLabel}>
          <p class="article-toc-title">{tocLabel}</p>
          <ol>
            {#each tocHeadings as heading}
              <li><a href={`#${heading.id}`}>{heading.text}</a></li>
            {/each}
          </ol>
        </nav>
      {/if}
      {#each blocksWithGlossary as block}
        {#if block.kind === 'h2'}
          <h2 class="article-h2" id={block.id}>{block.text}</h2>
        {:else if block.kind === 'callout'}
          <aside class="article-callout">{#each block.segments as seg}{#if seg.href}<a href={seg.href} target="_blank" rel="noopener noreferrer">{seg.t}</a>{:else if seg.b}<strong>{seg.t}</strong>{:else if seg.i}<em>{seg.t}</em>{:else}{#each seg.glossaryParts ?? [{ text: seg.t }] as part}{#if part.termId}<GlossaryTerm termId={part.termId} text={part.text} definition={(glossaryById[part.termId] as any)['definition' + tableSuffix]} />{:else}{part.text}{/if}{/each}{/if}{/each}</aside>
        {:else if block.kind === 'diagram'}
          {@const def = diagramDef(block.id, lang)}
          {#if def}
            <figure class="article-figure">
              {#key def}
                <MermaidDiagram definition={def} description={block.caption} />
              {/key}
              {#if block.caption}<figcaption>{block.caption}</figcaption>{/if}
            </figure>
          {/if}
        {:else if block.kind === 'table'}
          {@const tbl = tableDef(block.id, lang)}
          {#if tbl}
            <div class="article-table-wrap">
              <table class="article-table">
                <thead>
                  <tr>
                    {#each tbl.headers as h}<th scope="col">{h}</th>{/each}
                  </tr>
                </thead>
                <tbody>
                  {#each tbl.rows as row}
                    <tr>
                      {#each row as cell}<td>{cell}</td>{/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        {:else if block.kind === 'widget'}
          {#if block.id === 'cost-calculator'}
            <CostCalculator {lang} />
          {/if}
        {:else}
          <p>{#each block.segments as seg}{#if seg.href}<a href={seg.href} target="_blank" rel="noopener noreferrer">{seg.t}</a>{:else if seg.b}<strong>{seg.t}</strong>{:else if seg.i}<em>{seg.t}</em>{:else}{#each seg.glossaryParts ?? [{ text: seg.t }] as part}{#if part.termId}<GlossaryTerm termId={part.termId} text={part.text} definition={(glossaryById[part.termId] as any)['definition' + tableSuffix]} />{:else}{part.text}{/if}{/each}{/if}{/each}</p>
        {/if}
      {/each}

      {#if aiModelsTable}
        <div class="article-table-wrap">
          <table class="article-table">
            <thead>
              <tr>
                <th scope="col">{aiModelsTable['taskHeader' + tableSuffix]}</th>
                <th scope="col">{aiModelsTable.modelHeader}</th>
              </tr>
            </thead>
            <tbody>
              {#each aiModelsTable.rows as row}
                <tr>
                  <td>{row['task' + tableSuffix]}</td>
                  <td><code>{row.model}</code></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if faqItems.length > 0}
        <section class="article-faq" aria-labelledby="article-faq-title">
          <h2 id="article-faq-title" class="article-h2">{faqLabel}</h2>
          <dl class="article-faq-list">
            {#each faqItems as item}
              <dt class="article-faq-q">{item.q}</dt>
              <dd class="article-faq-a">{item.a}</dd>
            {/each}
          </dl>
        </section>
        {@html faqJsonLd}
      {/if}

      {#if relatedProduct}
        <aside class="related-product" aria-label={relatedLabel}>
          <span class="related-label">{relatedLabel}</span>
          <a href={withLocale(`/products/${relatedProduct.id}/`, lang)} class="related-link">
            {t(relatedProduct.nameKey, lang)}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </aside>
      {/if}

      {#if relatedPosts.length > 0}
        <section class="related-articles" aria-labelledby="related-articles-title">
          <h2 id="related-articles-title" class="related-articles-title">{relatedArticlesLabel}</h2>
          <div class="related-articles-list">
            {#each relatedPosts as related (related.slug)}
              <article class="related-article-card">
                <h3 class="related-article-title">
                  <a href={withLocale(`/blog/${related.slug}/`, lang)}>{relatedTitle(related, lang)}</a>
                </h3>
                <p class="related-article-summary">{relatedSummary(related, lang)}</p>
                <a href={withLocale(`/blog/${related.slug}/`, lang)} class="related-article-link">{readArticleLabel}</a>
              </article>
            {/each}
          </div>
        </section>
      {/if}

      <div class="back-link">
        <a href={withLocale('/blog/', lang)}>{backLabel}</a>
      </div>
    </div>
  </div>
</article>
{:else}
<p class="not-found" style="padding: 4rem 2rem; text-align: center;">{t('blog.articleNotFound', lang)}</p>
{/if}

<style>
  .reading-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--color-primary, #1e3a8a);
    z-index: 40; /* above --z-sticky (30, the sticky header) per the scale in app.css */
  }
  .article-hero {
    background: var(--color-bg-hero, #0f172a);
    color: #fff;
    padding: 4rem 2rem;
  }
  .article-inner { max-width: 720px; margin: 0 auto; }
  .article-breadcrumb { font-size: 0.875rem; opacity: 0.7; margin-bottom: 1.5rem; }
  .article-breadcrumb a { color: inherit; text-decoration: none; }
  .article-breadcrumb a:hover { text-decoration: underline; }
  .article-breadcrumb span { margin: 0 0.5rem; }
  .article-title { font-size: 2rem; font-weight: 700; margin: 0 0 1rem; line-height: 1.25; }
  .article-byline { font-size: 0.9375rem; opacity: 0.85; margin: 0 0 0.75rem; }
  .article-byline a { color: inherit; font-weight: 600; text-decoration: none; }
  .article-byline a:hover { text-decoration: underline; }
  .article-date { font-size: 0.875rem; opacity: 0.7; }
  .article-meta-sep,
  .article-reading-time { font-size: 0.875rem; opacity: 0.7; }
  .article-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
  .tag { padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.15); border-radius: 0.25rem; font-size: 0.75rem; }
  .article-body { padding: 3rem 2rem; background: var(--color-bg-primary, #fff); }
  .article-body p { line-height: 1.8; margin-bottom: 1.25rem; color: var(--color-text-primary, #1e293b); text-align: justify; }
  .article-body :global(strong) { font-weight: 600; color: var(--color-text-primary, #1e293b); }
  .article-body :global(em) { font-style: italic; }
  /* Body citations. Scoped to prose and callouts rather than `.article-body a`, which would also
     catch the table-of-contents links above (they deliberately carry no underline). */
  .article-body p a,
  .article-callout a {
    color: var(--color-primary, #1e3a8a);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
  .article-body p a:hover,
  .article-callout a:hover { color: var(--color-accent, #f97316); }
  .article-toc {
    margin: 0 0 2.5rem;
    padding: 1.25rem 1.5rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
  }
  .article-toc-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 0.75rem;
  }
  .article-toc ol {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    counter-reset: toc-item;
  }
  .article-toc li {
    counter-increment: toc-item;
  }
  .article-toc li::before {
    content: counter(toc-item) '. ';
    color: var(--color-text-tertiary, #64748b);
    font-weight: 600;
  }
  .article-toc a {
    color: var(--color-primary, #1e3a8a);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.9375rem;
  }
  .article-toc a:hover { text-decoration: underline; }
  .article-h2 {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 2.75rem 0 1rem;
    color: var(--color-text-primary, #1e293b);
    /* Clear the sticky header, otherwise a table-of-contents jump leaves the heading hidden
       behind it and the reader lands ~3 lines into the section. */
    scroll-margin-top: calc(var(--header-height, 89px) + 1rem);
  }
  .article-callout {
    display: block;
    margin: 1.75rem 0;
    padding: 1rem 1.25rem;
    background: var(--color-bg-secondary, #f8fafc);
    border-left: 3px solid var(--color-accent, #f97316);
    border-radius: 0 0.5rem 0.5rem 0;
    color: var(--color-text-secondary, #475569);
    line-height: 1.75;
    font-size: 0.95rem;
  }
  .article-figure { margin: 1.75rem 0 2rem; }
  .article-figure figcaption {
    margin-top: 0.65rem;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--color-text-tertiary, #64748b);
    text-align: center;
  }
  .article-table-wrap {
    margin: 2rem 0;
    overflow-x: auto;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
  }
  .article-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }
  .article-table th,
  .article-table td {
    text-align: left;
    padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
  }
  .article-table thead th {
    background: var(--color-bg-secondary, #f8fafc);
    color: var(--color-text-secondary, #475569);
    font-weight: 600;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .article-table tbody tr:last-child td { border-bottom: none; }
  .article-table td:first-child { color: var(--color-text-primary, #1e293b); }
  .article-table code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    padding: 0.15rem 0.4rem;
    background: var(--color-bg-secondary, #f1f5f9);
    border-radius: 0.25rem;
    white-space: nowrap;
    color: var(--color-primary, #1e3a8a);
  }
  .article-faq { margin: 3rem 0 0; }
  .article-faq-list { margin: 1.25rem 0 0; }
  .article-faq-q {
    font-weight: 700;
    color: var(--color-text-primary, #1e293b);
    margin: 1.5rem 0 0.4rem;
    line-height: 1.45;
  }
  .article-faq-q:first-of-type { margin-top: 0; }
  .article-faq-a {
    margin: 0;
    line-height: 1.75;
    color: var(--color-text-secondary, #475569);
  }

  .related-product {
    margin: 2.5rem 0 0;
    padding: 1.25rem 1.5rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-left: 3px solid var(--color-primary, #1e3a8a);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .related-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .related-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--color-primary, #1e3a8a);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.9375rem;
  }
  .related-link:hover { text-decoration: underline; }
  .related-link svg { flex-shrink: 0; }

  .related-articles { margin: 2.5rem 0 0; }
  .related-articles-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: var(--color-text-primary, #1e293b);
  }
  .related-articles-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .related-article-card {
    padding: 1.25rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
  }
  .related-article-title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.35;
    margin: 0 0 0.5rem;
  }
  .related-article-title a {
    color: var(--color-text-primary, #1e293b);
    text-decoration: none;
  }
  .related-article-title a:hover { text-decoration: underline; }
  p.related-article-summary {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text-secondary, #475569);
    text-align: left;
    margin: 0 0 0.75rem;
    flex-grow: 1;
  }
  .related-article-link {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary, #1e3a8a);
    text-decoration: none;
    align-self: flex-start;
  }
  .related-article-link:hover { text-decoration: underline; }

  .back-link { margin-top: 2.5rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
