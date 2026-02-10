<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: title = t('company.title', currentLanguage);
  $: foundedLabel = t('company.founded', currentLanguage);
  $: foundedYear = t('company.foundedYear', currentLanguage);
  $: locationLabel = t('company.location', currentLanguage);
  $: address = t('company.address', currentLanguage);
  $: nipLabel = t('company.nip', currentLanguage);
  $: nipValue = t('company.nipValue', currentLanguage);
  $: regonLabel = t('company.regon', currentLanguage);
  $: regonValue = t('company.regonValue', currentLanguage);
  $: industryLabel = t('company.industry', currentLanguage);
  $: industryValue = t('company.industryValue', currentLanguage);

  const companyName = "MiСode Sp. z o.o.";
</script>

<section class="company-info scroll-reveal" aria-labelledby="company-title">
  <div class="company-container">
    <h2 id="company-title" class="company-title">{title}</h2>

    <div class="company-name-display">
      <p class="company-name">{companyName}</p>
    </div>

    <div class="company-grid">
      <div class="info-item">
        <dt class="info-label">{foundedLabel}</dt>
        <dd class="info-value">{foundedYear}</dd>
      </div>

      <div class="info-item">
        <dt class="info-label">{locationLabel}</dt>
        <dd class="info-value">{address}</dd>
      </div>

      <div class="info-item">
        <dt class="info-label">{nipLabel}</dt>
        <dd class="info-value">{nipValue}</dd>
      </div>

      <div class="info-item">
        <dt class="info-label">{regonLabel}</dt>
        <dd class="info-value">{regonValue}</dd>
      </div>

      <div class="info-item info-item-wide">
        <dt class="info-label">{industryLabel}</dt>
        <dd class="info-value">{industryValue}</dd>
      </div>
    </div>
  </div>
</section>

<style>
  .company-info {
    background: var(--color-bg-primary);
    padding: 5rem 0;
  }

  .company-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .company-title {
    margin: 0 0 2rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .company-name-display {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .company-name {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-primary);
  }

  .company-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  .info-item {
    background: var(--color-bg-secondary);
    padding: 1.5rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    transition: box-shadow var(--transition-base);
  }

  .info-item:hover {
    box-shadow: var(--shadow-md);
  }

  .info-item-wide {
    grid-column: 1 / -1;
  }

  .info-label {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-value {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.5;
  }

  @media (max-width: 767px) {
    .company-info {
      padding: 3rem 0;
    }

    .company-container {
      padding: 0 1rem;
    }

    .company-title {
      font-size: 1.5rem;
    }

    .company-name {
      font-size: 1.25rem;
    }

    .company-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .info-item {
      padding: 1.25rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .company-info {
      padding: 4rem 0;
    }

    .company-container {
      padding: 0 1.5rem;
    }

    .company-title {
      font-size: 1.75rem;
    }

    .company-name {
      font-size: 1.5rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .company-info {
      background: var(--color-bg-primary);
    }

    .info-item {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }
  }

  @media (prefers-contrast: high) {
    .info-item {
      border: 2px solid #000000;
      box-shadow: none;
    }
  }

  @media print {
    .company-info {
      background: #ffffff;
      padding: 1rem 0;
    }

    .info-item {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .info-item:hover {
      box-shadow: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .info-item {
      transition: none;
    }
  }
</style>
