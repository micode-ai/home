<script lang="ts">
  import type { Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { LOCALES, withLocale } from '../services/locale';
  import { availableLanguages, type LangPost } from '../services/articleLanguages';

  let { post, slug, lang }: { post: LangPost; slug: string; lang: Language } = $props();

  const available = $derived(availableLanguages(post));
</script>

<ul class="lang-chips" aria-label={t('blog.languages.label', lang)}>
  {#each LOCALES as l}
    <li>
      {#if l === lang}
        <span class="lang-chip active" aria-current="true">{l.toUpperCase()}</span>
      {:else if available.includes(l)}
        <a class="lang-chip" href={withLocale(`/blog/${slug}/`, l)} hreflang={l}>{l.toUpperCase()}</a>
      {:else}
        <span class="lang-chip missing" aria-disabled="true" title={t('blog.languages.unavailable', lang)}
          aria-label={`${l.toUpperCase()} — ${t('blog.languages.unavailable', lang)}`}>{l.toUpperCase()}</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .lang-chips { display: flex; gap: 0.4rem; list-style: none; padding: 0; margin: 0.75rem 0 0; }
  .lang-chip {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
    background: var(--color-bg-secondary, #f1f5f9);
    color: var(--color-text-primary, #1e293b);
  }
  a.lang-chip:hover { background: var(--color-border, #e2e8f0); }
  .lang-chip.active { background: var(--color-primary, #1e3a8a); color: var(--color-bg, #fff); }
  .lang-chip.missing { opacity: 0.5; text-decoration: line-through; }
</style>
