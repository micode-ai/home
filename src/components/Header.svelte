<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import logoUrl from '../assets/images/mi_code_logo_mark.svg';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: companyName = t('header.companyName', currentLanguage);
  $: tagline = t('header.tagline', currentLanguage);
</script>

<header class="header">
  <div class="header-container">
    <div class="header-brand">
      <img src={logoUrl} alt="{companyName} logo" class="header-logo" />
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
    z-index: var(--z-sticky);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    transition: box-shadow var(--transition-base);
  }

  .header:hover {
    box-shadow: var(--shadow-md);
  }

  .header-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex: 1;
    min-width: 0;
  }

  .header-logo {
    height: 56px;
    width: auto;
    display: block;
    flex-shrink: 0;
  }

  .header-text {
    min-width: 0;
  }

  .company-name {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-primary);
  }

  .tagline {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .header-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  @media (max-width: 767px) {
    .header-logo {
      height: 40px;
    }

    .header-brand {
      gap: 0.625rem;
    }

    .header-container {
      padding: 0.75rem 1rem;
      gap: 0.75rem;
    }

    .company-name {
      font-size: 1.25rem;
    }

    .tagline {
      font-size: 0.8rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .header-container {
      padding: 1rem 1.5rem;
    }

    .company-name {
      font-size: 1.4rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom-color: var(--color-border);
    }

    .header-logo {
      filter: invert(1) hue-rotate(180deg);
    }

    .company-name {
      color: var(--color-primary);
    }

    .tagline {
      color: var(--color-text-tertiary);
    }
  }

  @media (prefers-contrast: high) {
    .header {
      border-bottom: 2px solid #000000;
      background: #ffffff;
    }

    .company-name {
      font-weight: 800;
    }
  }

  @media print {
    .header {
      position: static;
      box-shadow: none;
      border-bottom: 2px solid #000;
    }
  }
</style>
