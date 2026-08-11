<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import blogPosts from '../data/blog-posts.json';
  import { estimateReadingMinutes } from '../services/readingTime';
  import { collectTags, rankTagsByCount, filterByTag, getTagFromQuery, buildTagQuery } from '../services/blogTagFilter';

  type Post = typeof blogPosts[number];

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const publishedPosts = blogPosts
    .filter(p => p.date <= todayStr)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  // `allTags` is the full alphabetical set the `?tag=` guard validates against; the bar itself
  // shows the most-used tags first and truncates. Every tag stays reachable either by expanding
  // the bar or from the tags on any post card below, which are the same filter buttons.
  const allTags = collectTags(publishedPosts);
  const rankedTags = rankTagsByCount(publishedPosts);
  // Seven tags, so the bar is one row at the listing's 800px column: measured, the `All` chip
  // plus seven of the current tags plus the disclosure fit on a line in all three locales, while
  // eight pushed the disclosure onto a line of its own. Most tags sit on a single post, so an
  // untruncated bar ran to roughly six rows and pushed the first post off the top of the page.
  const VISIBLE_TAG_COUNT = 7;

  let activeTag = $state<string | null>(null);
  let tagsExpanded = $state(false);
  const visiblePosts = $derived(filterByTag(publishedPosts, activeTag));

  const collapsedTags = $derived.by(() => {
    const head = rankedTags.slice(0, VISIBLE_TAG_COUNT);
    // An active tag out of the truncated tail stays on the bar: collapsing it away would leave
    // the bar with no pressed chip while the list below is still filtered.
    return activeTag && !head.includes(activeTag) ? [...head, activeTag] : head;
  });
  const shownTags = $derived(tagsExpanded ? rankedTags : collapsedTags);
  const hiddenTagCount = $derived(rankedTags.length - shownTags.length);
  // Collapsed is the default, so this is also what `scripts/prerender.mjs` bakes into the HTML.
  const tagBarTruncates = rankedTags.length > VISIBLE_TAG_COUNT;

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

  function getShowMoreLabel(count: number, lang: string): string {
    return t('blog.filter.showMore', lang).replace('{count}', String(count));
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
      {#each shownTags as tag}
        <button
          type="button"
          class="tag filter-chip"
          class:active={activeTag === tag}
          aria-pressed={activeTag === tag}
          aria-label={getTagAriaLabel(tag, $languageStore)}
          onclick={() => toggleTag(tag)}
        >{tag}</button>
      {/each}
      {#if tagBarTruncates}
        <button
          type="button"
          class="filter-chip tag-toggle"
          aria-expanded={tagsExpanded}
          onclick={() => (tagsExpanded = !tagsExpanded)}
        >{tagsExpanded
            ? t('blog.filter.showLess', $languageStore)
            : getShowMoreLabel(hiddenTagCount, $languageStore)}</button>
      {/if}
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
  /* Deliberately not a `.tag`: the disclosure is an action on the bar, not one more tag to
     filter by, and reading as a chip is what makes a "+24 more" button look clickable-but-inert. */
  .tag-toggle {
    background: none;
    border: none;
    border-radius: 0.25rem;
    color: var(--color-primary, #1e3a8a);
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .tag-toggle:hover { text-decoration: underline; }
  .back-link { margin-top: 3rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
