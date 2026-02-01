<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import servicesData from '../data/services.json';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive section title
  $: sectionTitle = t('services.title', currentLanguage);

  // Service interface
  interface Service {
    id: string;
    icon: string;
    titleKey: string;
    descriptionKey: string;
  }

  // Load services
  const services: Service[] = servicesData;
</script>

<section class="services scroll-reveal" aria-labelledby="services-title">
  <div class="services-container">
    <h2 id="services-title" class="services-title">{sectionTitle}</h2>
    
    <div class="services-grid">
      {#each services as service (service.id)}
        <article class="service-card">
          <div class="service-icon" aria-hidden="true">{service.icon}</div>
          <h3 class="service-title">{t(service.titleKey, currentLanguage)}</h3>
          <p class="service-description">{t(service.descriptionKey, currentLanguage)}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .services {
    background: var(--gradient-section-alt);
    padding: 4rem 0;
    position: relative;
    overflow: hidden;
  }


  .services-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .services-title {
    margin: 0 0 3rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .service-card {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: 2rem;
    padding-top: 2rem;
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
    text-align: center;
    position: relative;
    overflow: hidden;
  }


  .service-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
  }

  .service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--glass-bg);
    border: var(--glass-border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .service-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.3;
  }

  .service-description {
    margin: 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
  }

  /* Mobile styles (< 768px) - 1 column */
  @media (max-width: 767px) {
    .services {
      padding: 2.5rem 0;
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
      gap: 1.5rem;
    }

    .service-card {
      padding: 1.5rem;
    }

    .service-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      width: 64px;
      height: 64px;
    }

    .service-title {
      font-size: 1.125rem;
      margin-bottom: 0.75rem;
    }

    .service-description {
      font-size: 0.9375rem;
    }
  }

  /* Tablet styles (768px - 1024px) - 2 columns */
  @media (min-width: 768px) and (max-width: 1024px) {
    .services {
      padding: 3rem 0;
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
      gap: 1.75rem;
    }

    .service-card {
      padding: 1.75rem;
    }

    .service-icon {
      font-size: 2.75rem;
      margin-bottom: 0.875rem;
      width: 72px;
      height: 72px;
    }

    .service-title {
      font-size: 1.1875rem;
      margin-bottom: 0.875rem;
    }

    .service-description {
      font-size: 0.96875rem;
    }
  }

  /* Desktop styles (> 1024px) - 3 columns */
  @media (min-width: 1025px) {
    .services {
      padding: 4rem 0;
    }

    .services-container {
      padding: 0 2rem;
    }

    .services-title {
      font-size: 2rem;
      margin-bottom: 3rem;
    }

    .services-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .service-card {
      padding: 2rem;
    }

    .service-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      width: 80px;
      height: 80px;
    }

    .service-title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .service-description {
      font-size: 1rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .services {
      background: var(--gradient-section-alt);
    }

    .services-title {
      color: #ffffff;
    }

    .service-card {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .service-card:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-medium);
    }

    .service-icon {
      background: var(--glass-bg);
      border: var(--glass-border);
    }

    .service-title {
      color: #ffffff;
    }

    .service-description {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .services {
      background-color: #ffffff;
    }

    .services-title {
      color: #000000;
      font-weight: 800;
    }

    .service-card {
      background-color: #ffffff;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .service-title {
      color: #000000;
      font-weight: 700;
    }

    .service-description {
      color: #000000;
      font-weight: 600;
    }
  }

  /* Print styles */
  @media print {
    .services {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .services-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .services-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .service-card {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 1rem;
      page-break-inside: avoid;
    }

    .service-card:hover {
      transform: none;
      box-shadow: none;
    }

    .service-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .service-title {
      color: #000000;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .service-description {
      color: #000000;
      font-size: 0.875rem;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .service-card {
      transition: none;
    }

    .service-card:hover {
      transform: none;
    }

  }
</style>
