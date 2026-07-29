<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import blogPosts from '../data/blog-posts.json';
  import { estimateReadingMinutes } from '../services/readingTime';
  import { collectTags, filterByTag, getTagFromQuery, buildTagQuery } from '../services/blogTagFilter';

  type Post = typeof blogPosts[number];

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const publishedPosts = blogPosts
    .filter(p => p.date <= todayStr)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  const allTags = collectTags(publishedPosts);
  let activeTag = $state<string | null>(null);
  const visiblePosts = $derived(filterByTag(publishedPosts, activeTag));

  // Restore the active tag from `?tag=` on mount only — Svelte's server-side `render()` (used by
  // scripts/prerender.mjs) never runs onMount, so this never executes during prerendering.
  onMount(() => {
    activeTag = getTagFromQuery(window.location.search, allTags);
  });

  function syncUrl() {
    const qs = buildTagQuery(window.location.search, activeTag);
    const url = `${window.location.pathname}${qs}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }

  function toggleTag(tag: string) {
    activeTag = activeTag === tag ? null : tag;
    syncUrl();
  }

  function getTagAriaLabel(tag: string, lang: string): string {
    return t('blog.filter.tagAriaLabel', lang).replace('{tag}', tag);
  }

  function getResultsCount(count: number, lang: string): string {
    return t('blog.filter.resultsCount', lang).replace('{count}', String(count));
  }

  function getTitle(post: Post, lang: string): string {
    if (lang === 'pl') return post.titlePl;
    if (lang === 'ru') return post.titleRu;
    return post.titleEn;
  }

  function getSummary(post: Post, lang: string): string {
    if (lang === 'pl') return post.summaryPl;
    if (lang === 'ru') return post.summaryRu;
    return post.summaryEn;
  }

  function getBody(post: Post, lang: string): string {
    if (lang === 'pl') return (post as any).bodyPl ?? '';
    if (lang === 'ru') return (post as any).bodyRu ?? '';
    return (post as any).bodyEn ?? '';
  }

  function getReadingTimeLabel(post: Post, lang: string): string {
    const minutes = estimateReadingMinutes(getBody(post, lang));
    return t('blog.readingTime', lang).replace('{min}', String(minutes));
  }

  function getBlogTitle(lang: string): string { return t('blog.title', lang); }
  function getBack(lang: string): string { return t('blog.backToMicode', lang); }
</script>

<section class="blog-listing" aria-labelledby="blog-title">
  <div class="blog-inner">
    <h1 id="blog-title" class="blog-headline">{getBlogTitle($languageStore)}</h1>
    <div class="filter-bar">
      <button
        type="button"
        class="tag filter-chip"
        class:active={activeTag === null}
        aria-pressed={activeTag === null}
        onclick={() => { activeTag = null; syncUrl(); }}
      >{t('blog.filter.all', $languageStore)}</button>
      {#each allTags as tag}
        <button
          type="button"
          class="tag filter-chip"
          class:active={activeTag === tag}
          aria-pressed={activeTag === tag}
          aria-label={getTagAriaLabel(tag, $languageStore)}
          onclick={() => toggleTag(tag)}
        >{tag}</button>
      {/each}
    </div>
    <p class="results-count" aria-live="polite">{getResultsCount(visiblePosts.length, $languageStore)}</p>
    {#if visiblePosts.length === 0}
      <p class="empty-state">{t('blog.filter.empty', $languageStore)}</p>
    {:else}
      <ul class="posts-list">
        {#each visiblePosts as post}
          <li class="post-card">
            <time class="post-date" datetime={post.date}>{post.date}</time>
            <span class="post-meta-sep" aria-hidden="true"> · </span>
            <span class="post-reading-time">{getReadingTimeLabel(post, $languageStore)}</span>
            <h2 class="post-title">
              <a href={withLocale(`/blog/${post.slug}/`, $languageStore)}>{getTitle(post, $languageStore)}</a>
            </h2>
            <p class="post-summary">{getSummary(post, $languageStore)}</p>
            <a href={withLocale(`/blog/${post.slug}/`, $languageStore)} class="read-link">{t('blog.readArticle', $languageStore)}</a>
            <div class="post-tags">
              {#each post.tags as tag}
                <button
                  type="button"
                  class="tag"
                  class:active={activeTag === tag}
                  aria-pressed={activeTag === tag}
                  aria-label={getTagAriaLabel(tag, $languageStore)}
                  onclick={() => toggleTag(tag)}
                >{tag}</button>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="back-link"><a href={withLocale('/', $languageStore)}>{getBack($languageStore)}</a></div>
  </div>
</section>

<style>
  .blog-listing { padding: 4rem 2rem; }
  .blog-inner { max-width: 800px; margin: 0 auto; }
  .blog-headline { font-size: 2.5rem; font-weight: 700; margin-bottom: 2rem; }
  .posts-list { list-style: none; padding: 0; margin: 0; }
  .post-card {
    padding: 2rem 0;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
  }
  .post-date { font-size: 0.875rem; color: var(--color-text-tertiary, #64748b); }
  .post-meta-sep,
  .post-reading-time { font-size: 0.875rem; color: var(--color-text-tertiary, #64748b); }
  .post-title { font-size: 1.5rem; margin: 0.5rem 0; }
  .post-title a { color: inherit; text-decoration: none; }
  .post-title a:hover { text-decoration: underline; }
  .read-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: var(--color-primary, #1e3a8a);
    font-weight: 500;
    text-decoration: none;
  }
  .read-link:hover { text-decoration: underline; }
  .post-summary { color: var(--color-text-tertiary, #64748b); line-height: 1.7; }
  .post-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .filter-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .results-count {
    font-size: 0.875rem;
    color: var(--color-text-tertiary, #64748b);
    margin: 0 0 1.5rem;
  }
  .empty-state { color: var(--color-text-tertiary, #64748b); padding: 2rem 0; }
  .tag {
    padding: 0.2rem 0.6rem;
    background: var(--color-bg-secondary, #f1f5f9);
    color: var(--color-text-primary, #1e293b);
    border: none;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-family: inherit;
    cursor: pointer;
  }
  .tag:hover { background: var(--color-border, #e2e8f0); }
  .tag.active {
    background: var(--color-primary, #1e3a8a);
    color: var(--color-bg, #fff);
  }
  .filter-chip { font-size: 0.8125rem; padding: 0.3rem 0.75rem; }
  .back-link { margin-top: 3rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
