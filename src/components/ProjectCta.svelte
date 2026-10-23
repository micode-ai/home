<script lang="ts">
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import { track } from '../services/tracking';
  import type { Language } from '../stores/languageStore';

  // The contact form lives only on the home page, while most visitors read articles and
  // product pages — this block is their way into it. The link hands a prefilled message over
  // through the `msg` param, the same bridge the cost calculator uses (see ContactForm).
  let {
    lang,
    location,
    itemId,
    subject
  }: {
    lang: Language;
    location: 'article_end' | 'product';
    itemId: string;
    /** Article title or product name, quoted in the heading and the prefilled message. */
    subject: string;
  } = $props();

  const isArticle = $derived(location === 'article_end');
  const heading = $derived(
    isArticle
      ? t('projectCta.articleTitle', lang)
      : t('projectCta.productTitle', lang).replace('{name}', subject)
  );
  const message = $derived(
    isArticle
      ? t('projectCta.articleMessage', lang).replace('{title}', subject)
      : t('projectCta.productMessage', lang).replace('{name}', subject)
  );
  const href = $derived(`${withLocale('/', lang)}?msg=${encodeURIComponent(message)}#contact`);

  function handleClick() {
    track('cta_click', { location, item_id: itemId });
  }
</script>

<aside class="project-cta" aria-labelledby="project-cta-title">
  <h2 id="project-cta-title" class="project-cta-title">{heading}</h2>
  <p class="project-cta-text">{t('projectCta.text', lang)}</p>
  <a class="project-cta-button" data-testid="project-cta-link" {href} onclick={handleClick}>
    {t('projectCta.button', lang)}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </a>
</aside>

<style>
  .project-cta {
    margin: 2.5rem 0;
    padding: 1.75rem 1.5rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-left: 4px solid color-mix(in srgb, var(--color-accent, #f97316) 72%, #000);
    border-radius: 0.5rem;
  }

  .project-cta-title {
    margin: 0 0 0.5rem;
    font-family: var(--font-heading);
    font-size: 1.375rem;
    line-height: 1.3;
  }

  .project-cta-text {
    margin: 0 0 1.25rem;
    color: var(--color-text-secondary, #475569);
  }

  .project-cta-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    font-family: var(--font-heading);
    font-weight: 600;
    color: #ffffff;
    /* Same AA-safe darkened accent as the hero CTA: plain --color-accent is 2.80:1 with white */
    background: color-mix(in srgb, var(--color-accent, #f97316) 72%, #000);
    border-radius: var(--radius-lg, 0.75rem);
    text-decoration: none;
    transition: transform var(--transition-base, 0.2s), box-shadow var(--transition-base, 0.2s);
  }

  .project-cta-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .project-cta-button:focus-visible {
    outline: 3px solid var(--color-focus, #2563eb);
    outline-offset: 3px;
  }

  @media (max-width: 640px) {
    .project-cta-button {
      width: 100%;
      justify-content: center;
    }
  }

  @media print {
    .project-cta {
      display: none;
    }
  }
</style>
