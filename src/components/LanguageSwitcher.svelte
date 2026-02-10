<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  function toggleLanguage() {
    const newLanguage: Language = currentLanguage === 'pl' ? 'en' : 'pl';
    languageStore.setLanguage(newLanguage);
  }
</script>

<button
  class="language-switcher"
  on:click={toggleLanguage}
  aria-label="Switch language"
  type="button"
>
  <span class="language-option" class:active={currentLanguage === 'pl'}>PL</span>
  <span class="separator">/</span>
  <span class="language-option" class:active={currentLanguage === 'en'}>EN</span>
</button>

<style>
  .language-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    cursor: pointer;
    font-family: var(--font-heading);
    font-size: 0.875rem;
    font-weight: 500;
    transition: border-color var(--transition-base), background-color var(--transition-base);
    color: var(--color-text-secondary);
    min-height: 44px;
    min-width: 44px;
  }

  .language-switcher:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary-light);
  }

  .language-switcher:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .language-option {
    color: var(--color-text-tertiary);
    transition: color var(--transition-fast);
  }

  .language-option.active {
    color: var(--color-primary);
    font-weight: 700;
  }

  .separator {
    color: var(--color-border-dark);
  }

  @media (max-width: 767px) {
    .language-switcher {
      padding: 0.4rem 0.75rem;
      font-size: 0.8125rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .language-switcher {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
      color: var(--color-text-secondary);
    }

    .language-switcher:hover {
      background: var(--color-bg-tertiary);
      border-color: var(--color-primary);
    }

    .language-option {
      color: var(--color-text-tertiary);
    }

    .language-option.active {
      color: var(--color-primary);
    }
  }
</style>
