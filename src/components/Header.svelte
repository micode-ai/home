<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive translation for company name
  $: companyName = t('header.companyName', currentLanguage);
  $: tagline = t('header.tagline', currentLanguage);
</script>

<header class="header">
  <div class="header-container">
    <div class="header-brand">
      <div class="company-name" role="heading" aria-level="1">{companyName}</div>
      <p class="tagline">{tagline}</p>
    </div>
    <nav class="header-actions" aria-label="Language selection">
      <LanguageSwitcher />
    </nav>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur-strong));
    -webkit-backdrop-filter: blur(var(--glass-blur-strong));
    border-bottom: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: box-shadow 0.3s ease, background 0.3s ease;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-brand {
    flex: 1;
    min-width: 0; /* Allow text truncation if needed */
  }

  .company-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.4;
  }

  .header-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .header-container {
      padding: 0.75rem 1rem;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .company-name {
      font-size: 1.25rem;
    }

    .tagline {
      font-size: 0.8rem;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .header-container {
      padding: 1rem 1.5rem;
    }

    .company-name {
      font-size: 1.4rem;
    }

    .tagline {
      font-size: 0.85rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .header-container {
      padding: 1.25rem 2rem;
    }

    .company-name {
      font-size: 1.5rem;
    }

    .tagline {
      font-size: 0.875rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .header {
      background: rgba(15, 15, 25, 0.7);
      backdrop-filter: blur(var(--glass-blur-strong));
      -webkit-backdrop-filter: blur(var(--glass-blur-strong));
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .company-name {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  /* Accessibility: High contrast mode */
  @media (prefers-contrast: high) {
    .header {
      border-bottom-width: 2px;
    }

    .company-name {
      font-weight: 800;
    }
  }

  /* Print styles */
  @media print {
    .header {
      position: static;
      box-shadow: none;
      border-bottom: 2px solid #000;
    }
  }
</style>
