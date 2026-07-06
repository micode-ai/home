<script lang="ts">
  import { languageStore, persistLanguage, type Language } from '../stores/languageStore';
  import { localizedPath } from '../services/locale';

  const languages: Language[] = ['pl', 'en', 'ru'];

  // Each locale is a real prerendered URL (/, /en/, /ru/), so switching language
  // navigates to the localized path of the current page rather than swapping
  // client-side. This keeps the URL, canonical and hreflang consistent for SEO.
  // The choice is persisted so the home page can redirect a returning visitor.
  function selectLanguage(lang: Language) {
    if (lang === $languageStore) return;
    persistLanguage(lang);
    window.location.assign(localizedPath(window.location.pathname, lang));
  }
</script>

<div class="language-switcher" role="group" aria-label="Language selection">
  {#each languages as lang, i}
    <button
      type="button"
      class="language-option"
      class:active={$languageStore === lang}
      aria-pressed={$languageStore === lang}
      aria-label="Switch to {lang.toUpperCase()}"
      onclick={() => selectLanguage(lang)}
    >
      {lang.toUpperCase()}
    </button>
    {#if i < languages.length - 1}
      <span class="separator" aria-hidden="true">/</span>
    {/if}
  {/each}
</div>

<style>
  .language-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-family: var(--font-heading);
    font-size: 0.875rem;
    font-weight: 500;
    transition: border-color var(--transition-base), background-color var(--transition-base);
    color: var(--color-text-secondary);
    min-height: 44px;
  }

  .language-switcher:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary-light);
  }

  .language-option {
    background: transparent;
    border: none;
    padding: 0.25rem 0.4rem;
    margin: 0;
    font: inherit;
    color: var(--color-text-tertiary);
    cursor: pointer;
    border-radius: var(--radius-full);
    transition: color var(--transition-fast), background-color var(--transition-fast);
    min-height: 32px;
    min-width: 32px;
    line-height: 1;
  }

  .language-option:hover {
    color: var(--color-primary-dark);
  }

  .language-option.active {
    color: var(--color-primary);
    font-weight: 700;
  }

  .language-option:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .separator {
    color: var(--color-border-dark);
    user-select: none;
  }

  @media (max-width: 767px) {
    .language-switcher {
      padding: 0.3rem 0.5rem;
      font-size: 0.8125rem;
    }

    .language-option {
      padding: 0.2rem 0.35rem;
    }
  }

  :global(html.dark-mode-active) .language-switcher {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
    color: var(--color-text-secondary);
  }

  :global(html.dark-mode-active) .language-switcher:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
  }

  :global(html.dark-mode-active) .language-option {
    color: var(--color-text-tertiary);
  }

  :global(html.dark-mode-active) .language-option.active {
    color: var(--color-primary);
  }
</style>
