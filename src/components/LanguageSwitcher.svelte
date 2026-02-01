<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Handle language toggle
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
  <span class="separator">|</span>
  <span class="language-option" class:active={currentLanguage === 'en'}>EN</span>
</button>

<style>
  .language-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-subtle));
    -webkit-backdrop-filter: blur(var(--glass-blur-subtle));
    border: var(--glass-border);
    border-radius: 50px;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #333;
  }

  .language-switcher:hover {
    background: var(--glass-bg-medium);
    border-color: rgba(102, 126, 234, 0.4);
  }

  .language-switcher:focus,
  .language-switcher:focus-visible {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  .language-option {
    color: #666;
    transition: color 0.3s ease;
  }

  .language-option.active {
    color: #333;
    font-weight: 700;
  }

  .separator {
    color: #ccc;
  }

  /* Ensure visibility on all viewport sizes */
  @media (max-width: 767px) {
    /* Mobile: smaller but still visible */
    .language-switcher {
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    /* Tablet: standard size */
    .language-switcher {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
  }

  @media (min-width: 1025px) {
    /* Desktop: standard size */
    .language-switcher {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
  }

  /* Ensure touch-friendly size on mobile (44x44px minimum) */
  @media (max-width: 767px) {
    .language-switcher {
      min-height: 44px;
      min-width: 80px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .language-switcher {
      background: var(--glass-bg);
      border: var(--glass-border);
      color: #fff;
    }

    .language-switcher:hover {
      background: var(--glass-bg-medium);
      border-color: rgba(102, 126, 234, 0.4);
    }

    .language-option {
      color: rgba(255, 255, 255, 0.5);
    }

    .language-option.active {
      color: #fff;
    }
  }
</style>
