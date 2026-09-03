<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import glossary from '../data/glossary.json';

  const lang = $derived($languageStore);
  const tableSuffix = $derived(lang === 'en' ? 'En' : lang === 'ru' ? 'Ru' : 'Pl');

  const companyName = $derived(t('header.companyName', lang));
  const backLabel = $derived(t('blog.backToMicode', lang));
  const title = $derived(t('glossary.title', lang));
  const intro = $derived(t('glossary.intro', lang));

  // Alphabetical by the canonical surface form (terms[0], same string across all three
  // locales per docs/contracts/blog-jargon-glossary-tooltips.md) — locale-independent sort key.
  const entries = $derived(
    [...glossary].sort((a, b) => a.terms[0].localeCompare(b.terms[0]))
  );
</script>

<article class="glossary-page" aria-labelledby="glossary-title">
  <div class="glossary-hero">
    <div class="glossary-inner">
      <nav class="glossary-breadcrumb" aria-label="Breadcrumb">
        <a href={withLocale('/', lang)}>{companyName}</a>
      </nav>
      <h1 id="glossary-title" class="glossary-title">{title}</h1>
      <p class="glossary-intro">{intro}</p>
    </div>
  </div>
  <div class="glossary-body">
    <div class="glossary-inner">
      <nav class="glossary-quicknav" aria-label={title}>
        {#each entries as entry (entry.id)}
          <a href="#{entry.id}">{entry.terms[0]}</a>
        {/each}
      </nav>

      {#each entries as entry (entry.id)}
        <section class="glossary-entry" id={entry.id}>
          <h2>{entry.terms[0]}</h2>
          <p>{entry[`definition${tableSuffix}`]}</p>
        </section>
      {/each}

      <div class="back-link">
        <a href={withLocale('/', lang)}>{backLabel}</a>
      </div>
    </div>
  </div>
</article>

<style>
  .glossary-hero {
    background: var(--color-bg-hero, #0f172a);
    color: #fff;
    padding: 4rem 2rem;
  }
  .glossary-inner { max-width: 720px; margin: 0 auto; }
  .glossary-breadcrumb { font-size: 0.875rem; opacity: 0.7; margin-bottom: 1.5rem; }
  .glossary-breadcrumb a { color: inherit; text-decoration: none; }
  .glossary-breadcrumb a:hover { text-decoration: underline; }
  .glossary-title { font-size: 2rem; font-weight: 700; margin: 0 0 0.75rem; line-height: 1.25; }
  .glossary-intro { margin: 0; font-size: 1rem; line-height: 1.7; opacity: 0.85; max-width: 60ch; }

  .glossary-body { padding: 3rem 2rem; background: var(--color-bg-primary, #fff); }

  .glossary-quicknav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 2.5rem;
  }
  .glossary-quicknav a {
    font-size: 0.8125rem;
    padding: 0.3rem 0.7rem;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    color: var(--color-text-secondary, #475569);
    text-decoration: none;
  }
  .glossary-quicknav a:hover,
  .glossary-quicknav a:focus-visible {
    color: var(--color-primary, #1e3a8a);
    border-color: var(--color-primary, #1e3a8a);
  }

  .glossary-entry {
    margin-bottom: 1.75rem;
    scroll-margin-top: 1.5rem;
  }
  .glossary-entry:last-of-type { margin-bottom: 0; }
  .glossary-entry h2 {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--color-text-primary, #1e293b);
  }
  .glossary-entry p {
    margin: 0;
    line-height: 1.8;
    color: var(--color-text-secondary, #475569);
  }

  .back-link { margin-top: 2.5rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
