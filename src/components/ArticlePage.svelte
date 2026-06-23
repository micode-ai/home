<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import blogPosts from '../data/blog-posts.json';

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
  const backLabel = $derived(t('blog.backToMicode', lang));
  const blogLabel = $derived(t('blog.title', lang));
</script>

{#if post}
<article class="article-page" aria-labelledby="article-title">
  <div class="article-hero">
    <div class="article-inner">
      <nav class="article-breadcrumb" aria-label="Breadcrumb">
        <a href="/">{t('header.companyName', lang)}</a>
        <span aria-hidden="true">›</span>
        <a href="/blog/">{blogLabel}</a>
      </nav>
      <h1 id="article-title" class="article-title">{title}</h1>
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
      {#if body}
        {#each body.split('\n\n') as para}
          <p>{para}</p>
        {/each}
      {/if}
      <div class="back-link">
        <a href="/blog/">{backLabel}</a>
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
  .article-date { font-size: 0.875rem; opacity: 0.7; }
  .article-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
  .tag { padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.15); border-radius: 0.25rem; font-size: 0.75rem; }
  .article-body { padding: 3rem 2rem; }
  .article-body p { line-height: 1.8; margin-bottom: 1.25rem; color: var(--color-text, #1e293b); }
  .back-link { margin-top: 3rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
