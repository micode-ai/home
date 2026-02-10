<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import servicesData from '../data/services.json';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: sectionTitle = t('services.title', currentLanguage);

  interface Service {
    id: string;
    icon: string;
    titleKey: string;
    descriptionKey: string;
  }

  const services: Service[] = servicesData;

  // SVG icon mapping by service ID (replaces emoji icons)
  const serviceIcons: Record<string, string> = {
    custom: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    integration: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    cloud: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`
  };
</script>

<section class="services scroll-reveal" aria-labelledby="services-title">
  <div class="services-container">
    <h2 id="services-title" class="services-title">{sectionTitle}</h2>

    <div class="services-grid">
      {#each services as service (service.id)}
        <article class="service-card">
          <div class="service-icon" aria-hidden="true">
            {#if serviceIcons[service.id]}
              {@html serviceIcons[service.id]}
            {:else}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            {/if}
          </div>
          <h3 class="service-title">{t(service.titleKey, currentLanguage)}</h3>
          <p class="service-description">{t(service.descriptionKey, currentLanguage)}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .services {
    background: var(--color-bg-secondary);
    padding: 5rem 0;
  }

  .services-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .services-title {
    margin: 0 0 3rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .service-card {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
    text-align: center;
    cursor: pointer;
  }

  .service-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }

  .service-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: var(--radius-xl);
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    margin-bottom: 1.25rem;
  }

  .service-title {
    margin: 0 0 0.75rem 0;
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .service-description {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  @media (max-width: 767px) {
    .services {
      padding: 3rem 0;
    }

    .services-container {
      padding: 0 1rem;
    }

    .services-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .services-grid {
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .service-card {
      padding: 1.5rem;
    }

    .service-icon {
      width: 56px;
      height: 56px;
      margin-bottom: 1rem;
    }

    .service-title {
      font-size: 1.125rem;
    }

    .service-description {
      font-size: 0.9375rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .services {
      padding: 4rem 0;
    }

    .services-container {
      padding: 0 1.5rem;
    }

    .services-title {
      font-size: 1.75rem;
      margin-bottom: 2.5rem;
    }

    .services-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .services {
      background: var(--color-bg-secondary);
    }

    .service-card {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .service-card:hover {
      background: var(--color-bg-tertiary);
    }

    .service-icon {
      background: var(--color-bg-tertiary);
      color: var(--color-primary);
    }
  }

  @media (prefers-contrast: high) {
    .service-card {
      border: 2px solid #000000;
      box-shadow: none;
    }
  }

  @media print {
    .services {
      background: #ffffff;
      padding: 1rem 0;
    }

    .services-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .service-card {
      border: 1px solid #000000;
      box-shadow: none;
      padding: 1rem;
    }

    .service-card:hover {
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .service-card {
      transition: none;
    }

    .service-card:hover {
      transform: none;
    }
  }
</style>
