<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive translations
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
  
  // Company name is constant
  const companyName = "Micode Sp. z o.o.";
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
    background: var(--gradient-section-light);
    padding: 4rem 0;
    position: relative;
    overflow: hidden;
  }

  /* Decorative orb */
  .company-info::before {
    content: '';
    position: absolute;
    bottom: -25%;
    left: -10%;
    width: 45%;
    height: 55%;
    background: radial-gradient(circle, var(--orb-pink) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    animation: float-orb-company 20s ease-in-out infinite;
  }

  @keyframes float-orb-company {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -10px) scale(1.04); }
    66% { transform: translate(-10px, 12px) scale(0.96); }
  }

  .company-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .company-title {
    margin: 0 0 2rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .company-name-display {
    text-align: center;
    margin-bottom: 2rem;
  }

  .company-name {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .company-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 0;
  }

  .info-item {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    padding: 1.5rem;
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .info-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
  }

  .info-item-wide {
    grid-column: 1 / -1;
  }

  .info-label {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: #2c3e50;
    line-height: 1.5;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .company-info {
      padding: 2.5rem 0;
    }

    .company-container {
      padding: 0 1rem;
    }

    .company-title {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .company-name-display {
      margin-bottom: 1.5rem;
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

    .info-label {
      font-size: 0.8125rem;
    }

    .info-value {
      font-size: 0.9375rem;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .company-info {
      padding: 3rem 0;
    }

    .company-container {
      padding: 0 1.5rem;
    }

    .company-title {
      font-size: 1.75rem;
      margin-bottom: 1.75rem;
    }

    .company-name-display {
      margin-bottom: 1.75rem;
    }

    .company-name {
      font-size: 1.5rem;
    }

    .company-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .info-item {
      padding: 1.375rem;
    }

    .info-label {
      font-size: 0.85rem;
    }

    .info-value {
      font-size: 0.96875rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .company-info {
      padding: 4rem 0;
    }

    .company-container {
      padding: 0 2rem;
    }

    .company-title {
      font-size: 2rem;
      margin-bottom: 2rem;
    }

    .company-name-display {
      margin-bottom: 2rem;
    }

    .company-name {
      font-size: 1.75rem;
    }

    .company-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      padding: 1.5rem;
    }

    .info-label {
      font-size: 0.875rem;
    }

    .info-value {
      font-size: 1rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .company-info {
      background: var(--gradient-section-light);
    }

    .company-title {
      color: #ffffff;
    }

    .company-name {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .info-item {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .info-item:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-medium);
    }

    .info-label {
      color: rgba(255, 255, 255, 0.6);
    }

    .info-value {
      color: #ffffff;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .company-info {
      background-color: #ffffff;
    }

    .company-title {
      color: #000000;
      font-weight: 800;
    }

    .company-name {
      color: #000000;
      font-weight: 800;
    }

    .info-item {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .info-label {
      color: #000000;
      font-weight: 700;
    }

    .info-value {
      color: #000000;
      font-weight: 600;
    }
  }

  /* Print styles */
  @media print {
    .company-info {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .company-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .company-name {
      color: #000000;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .company-grid {
      gap: 0.75rem;
    }

    .info-item {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      padding: 0.75rem;
      page-break-inside: avoid;
    }

    .info-item:hover {
      transform: none;
      box-shadow: none;
    }

    .info-label {
      color: #000000;
    }

    .info-value {
      color: #000000;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .info-item {
      transition: none;
    }

    .info-item:hover {
      transform: none;
    }

    .company-info::before {
      animation: none;
    }
  }
</style>
