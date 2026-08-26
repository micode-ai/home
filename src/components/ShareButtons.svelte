<script lang="ts">
  import { t } from '../services/i18n';
  import { copyToClipboard } from '../services/clipboard';
  import { track } from '../services/tracking';

  let { url, title, lang }: { url: string; title: string; lang: string } = $props();

  const linkedinHref = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  );
  const twitterHref = $derived(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  );

  let copyState = $state<'idle' | 'copied' | 'error'>('idle');
  let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  function trackShare(method: string) {
    track('share', { method, content_type: 'article', item_id: url });
  }

  async function handleCopyLink() {
    trackShare('copy_link');
    const ok = await copyToClipboard(url);
    copyState = ok ? 'copied' : 'error';
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => (copyState = 'idle'), 2000);
  }

  const copyLabel = $derived(
    copyState === 'copied' ? t('blog.share.copyLinkCopied', lang)
    : copyState === 'error' ? t('blog.share.copyLinkFailed', lang)
    : t('blog.share.copyLink', lang)
  );
</script>

<div class="share-row" role="group" aria-label={t('blog.share.label', lang)}>
  <a
    class="share-btn"
    href={linkedinHref}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={t('blog.share.linkedin', lang)}
    onclick={() => trackShare('linkedin')}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>
  </a>
  <a
    class="share-btn"
    href={twitterHref}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={t('blog.share.twitter', lang)}
    onclick={() => trackShare('twitter')}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.7 22H2.4l7.7-8.8L1 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 4h-1.9l12.2 16Z"/></svg>
  </a>
  <button
    type="button"
    class="share-btn share-copy-btn"
    data-testid="share-copy-button"
    aria-live="polite"
    onclick={handleCopyLink}
  >
    {copyLabel}
  </button>
</div>

<style>
  .share-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }
  .share-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 40px;
    min-width: 40px;
    padding: 0.5rem 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .share-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  .share-copy-btn {
    padding: 0.5rem 0.9rem;
  }
  @media (prefers-reduced-motion: reduce) {
    .share-btn {
      transition: none;
    }
  }
</style>
