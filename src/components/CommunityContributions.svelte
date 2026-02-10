<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: sectionTitle = t('community.title', currentLanguage);

  const contributions = [
    {
      id: 'blog',
      iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>`,
      titleKey: 'community.blog.title',
      descriptionKey: 'community.blog.description',
      stats: '400,000+',
      link: null
    },
    {
      id: 'opensource',
      iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      titleKey: 'community.opensource.title',
      descriptionKey: 'community.opensource.description',
      stats: null,
      link: 'https://www.npmjs.com/package/ngx-open-web-ui-chat'
    }
  ];
</script>

<section class="community scroll-reveal" aria-labelledby="community-title">
  <div class="community-container">
    <h2 id="community-title" class="community-title">{sectionTitle}</h2>

    <div class="contributions-grid">
      {#each contributions as contribution (contribution.id)}
        <article class="contribution-card">
          <div class="contribution-icon" aria-hidden="true">
            {@html contribution.iconSvg}
          </div>
          <h3 class="contribution-title">{t(contribution.titleKey, currentLanguage)}</h3>
          {#if contribution.stats}
            <div class="contribution-stats">{contribution.stats}</div>
          {/if}
          <p class="contribution-description">{t(contribution.descriptionKey, currentLanguage)}</p>
          {#if contribution.link}
            <a
              href={contribution.link}
              class="contribution-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View {t(contribution.titleKey, currentLanguage)} on npm"
            >
              View on npm
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .community {
    background: var(--color-bg-primary);
    padding: 5rem 0;
  }

  .community-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .community-title {
    margin: 0 0 3rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .contributions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .contribution-card {
    background: var(--color-bg-secondary);
    padding: 2rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .contribution-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }

  .contribution-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-xl);
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    margin-bottom: 1.25rem;
  }

  .contribution-title {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .contribution-stats {
    margin: 0 0 1rem 0;
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-accent);
  }

  .contribution-description {
    margin: 0 0 1.5rem 0;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    flex-grow: 1;
  }

  .contribution-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1.25rem;
    background: var(--color-primary);
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    transition: background-color var(--transition-base);
  }

  .contribution-link:hover {
    background: var(--color-primary-dark);
  }

  .contribution-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    .community {
      padding: 3rem 0;
    }

    .community-container {
      padding: 0 1rem;
    }

    .community-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .contributions-grid {
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .contribution-card {
      padding: 1.5rem;
    }

    .contribution-stats {
      font-size: 1.5rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .community {
      padding: 4rem 0;
    }

    .community-container {
      padding: 0 1.5rem;
    }

    .community-title {
      font-size: 1.75rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .contribution-card {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .contribution-icon {
      background: var(--color-bg-tertiary);
      color: var(--color-primary);
    }

    .contribution-stats {
      color: var(--color-accent);
    }
  }

  @media (prefers-contrast: high) {
    .contribution-card {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .contribution-link {
      background: #000000;
      border: 2px solid #000000;
    }
  }

  @media print {
    .community {
      background: #ffffff;
      padding: 1rem 0;
    }

    .contribution-card {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .contribution-card:hover {
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .contribution-card {
      transition: none;
    }

    .contribution-card:hover {
      transform: none;
    }
  }
</style>
