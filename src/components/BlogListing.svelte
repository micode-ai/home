<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import blogPosts from '../data/blog-posts.json';

  type Post = typeof blogPosts[number];

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
</script>

<section class="blog-listing" aria-labelledby="blog-title">
  <div class="blog-inner">
    <h1 id="blog-title" class="blog-headline">Blog</h1>
    <ul class="posts-list">
      {#each blogPosts as post}
        <li class="post-card">
          <time class="post-date" datetime={post.date}>{post.date}</time>
          <h2 class="post-title">
            <a href="/blog/{post.slug}/">{getTitle(post, $languageStore)}</a>
          </h2>
          <p class="post-summary">{getSummary(post, $languageStore)}</p>
          <div class="post-tags">
            {#each post.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </li>
      {/each}
    </ul>
    <div class="back-link"><a href="/">← Back to MiCode</a></div>
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
  .post-date { font-size: 0.875rem; color: var(--color-muted, #64748b); }
  .post-title { font-size: 1.5rem; margin: 0.5rem 0; }
  .post-title a { color: inherit; text-decoration: none; }
  .post-title a:hover { color: var(--color-primary, #1e3a8a); }
  .post-summary { color: var(--color-muted, #64748b); line-height: 1.7; }
  .post-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .tag {
    padding: 0.2rem 0.6rem;
    background: var(--color-bg-alt, #f1f5f9);
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  .back-link { margin-top: 3rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
