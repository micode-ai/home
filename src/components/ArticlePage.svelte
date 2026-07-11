<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import blogPosts from '../data/blog-posts.json';
  import products from '../data/products.json';
  import MermaidDiagram from './MermaidDiagram.svelte';
  import { articleDiagrams } from '../data/article-diagrams';

  type Post = typeof blogPosts[number];

  let { slug }: { slug: string } = $props();

  const post = $derived(blogPosts.find((p) => p.slug === slug) as Post | undefined);
  const lang = $derived($languageStore);

  const title = $derived(post
    ? (lang === 'pl' ? post.titlePl : lang === 'ru' ? post.titleRu : post.titleEn)
    : '');
  const body = $derived(post
    ? (lang === 'pl' ? (post as any).bodyPl : lang === 'ru' ? (post as any).bodyRu : (post as any).bodyEn) ?? ''
    : '');

  // Body is authored as `\n\n`-separated chunks. Most chunks are plain paragraphs; a few opt into
  // light markup: `## heading`, `> callout`, and `[[diagram:id|caption]]` (renders a Mermaid figure).
  // Inline `**bold**` is supported inside paragraphs/callouts. Plain-prose posts are unaffected.
  type Seg = { t: string; b: boolean };
  type Block =
    | { kind: 'p'; segments: Seg[] }
    | { kind: 'h2'; text: string }
    | { kind: 'callout'; segments: Seg[] }
    | { kind: 'diagram'; id: string; caption: string };

  const DIAGRAM_RE = /^\[\[diagram:([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/i;

  function inlineSegments(text: string): Seg[] {
    return text.split('**').map((t, i) => ({ t, b: i % 2 === 1 }));
  }

  // Diagrams are authored per language; fall back to Russian if a language is missing.
  function diagramDef(id: string, l: string): string | undefined {
    const entry = (articleDiagrams as Record<string, Record<string, string>>)[id];
    if (!entry) return undefined;
    return entry[l] ?? entry.ru;
  }

  const blocks = $derived.by<Block[]>(() => {
    if (!body) return [];
    return body.split('\n\n').map((chunk: string): Block => {
      const c = chunk.trim();
      const dm = c.match(DIAGRAM_RE);
      if (dm) return { kind: 'diagram', id: dm[1], caption: (dm[2] ?? '').trim() };
      if (c.startsWith('## ')) return { kind: 'h2', text: c.slice(3).trim() };
      if (c.startsWith('> ')) return { kind: 'callout', segments: inlineSegments(c.replace(/^> ?/gm, '').trim()) };
      return { kind: 'p', segments: inlineSegments(chunk) };
    });
  });
  const backLabel = $derived(t('blog.backToMicode', lang));
  const blogLabel = $derived(t('blog.title', lang));

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
</script>

{#if post}
<article class="article-page" aria-labelledby="article-title">
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
      <div class="article-tags">
        {#each post.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    </div>
  </div>
  <div class="article-body">
    <div class="article-inner">
      {#each blocks as block}
        {#if block.kind === 'h2'}
          <h2 class="article-h2">{block.text}</h2>
        {:else if block.kind === 'callout'}
          <aside class="article-callout">{#each block.segments as seg}{#if seg.b}<strong>{seg.t}</strong>{:else}{seg.t}{/if}{/each}</aside>
        {:else if block.kind === 'diagram'}
          {@const def = diagramDef(block.id, lang)}
          {#if def}
            <figure class="article-figure">
              {#key def}
                <MermaidDiagram definition={def} />
              {/key}
              {#if block.caption}<figcaption>{block.caption}</figcaption>{/if}
            </figure>
          {/if}
        {:else}
          <p>{#each block.segments as seg}{#if seg.b}<strong>{seg.t}</strong>{:else}{seg.t}{/if}{/each}</p>
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

      {#if relatedProduct}
        <aside class="related-product" aria-label={relatedLabel}>
          <span class="related-label">{relatedLabel}</span>
          <a href={withLocale(`/products/${relatedProduct.id}/`, lang)} class="related-link">
            {t(relatedProduct.nameKey, lang)}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </aside>
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
  .article-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
  .tag { padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.15); border-radius: 0.25rem; font-size: 0.75rem; }
  .article-body { padding: 3rem 2rem; background: var(--color-bg-primary, #fff); }
  .article-body p { line-height: 1.8; margin-bottom: 1.25rem; color: var(--color-text-primary, #1e293b); }
  .article-body :global(strong) { font-weight: 600; color: var(--color-text-primary, #1e293b); }
  .article-h2 {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 2.75rem 0 1rem;
    color: var(--color-text-primary, #1e293b);
    scroll-margin-top: 1rem;
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

  .back-link { margin-top: 2.5rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
