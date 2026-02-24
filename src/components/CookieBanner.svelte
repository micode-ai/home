<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { getItem, setItem } from '../services/storage';
  import { initializeAnalytics } from '../services/analytics';

  const COOKIE_CONSENT_KEY = 'cookieConsent';

  let visible = false;
  let currentLanguage: Language;

  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  onMount(() => {
    const stored = getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      visible = true;
      document.documentElement.classList.add('cookie-banner-visible');
    }
  });

  function accept() {
    setItem(COOKIE_CONSENT_KEY, 'accepted');
    initializeAnalytics();
    visible = false;
    document.documentElement.classList.remove('cookie-banner-visible');
  }

  function reject() {
    setItem(COOKIE_CONSENT_KEY, 'rejected');
    visible = false;
    document.documentElement.classList.remove('cookie-banner-visible');
  }
</script>

{#if visible}
  <div class="cookie-banner" role="region" aria-label="Cookie consent">
    <p class="cookie-message">{t('legal.cookieBanner.message', currentLanguage)}</p>
    <div class="cookie-actions">
      <button class="btn-reject" on:click={reject}>
        {t('legal.cookieBanner.reject', currentLanguage)}
      </button>
      <button class="btn-accept" on:click={accept}>
        {t('legal.cookieBanner.accept', currentLanguage)}
      </button>
    </div>
  </div>
{/if}

<style>
  .cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background: var(--color-bg-hero, #1a1a2e);
    color: #ffffff;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.25);
  }

  .cookie-message {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.85);
    flex: 1;
  }

  .cookie-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .btn-accept,
  .btn-reject {
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    transition: background 0.15s, color 0.15s;
  }

  .btn-accept {
    background: var(--color-accent, #e84393);
    color: #ffffff;
    border: none;
  }

  .btn-accept:hover {
    background: var(--color-accent-dark, #c0356f);
  }

  .btn-accept:focus {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  .btn-reject {
    background: transparent;
    color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .btn-reject:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.6);
  }

  .btn-reject:focus {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    .cookie-banner {
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
      gap: 1rem;
    }

    .cookie-actions {
      width: 100%;
    }

    .btn-accept,
    .btn-reject {
      flex: 1;
      text-align: center;
    }
  }

  @media (prefers-contrast: high) {
    .cookie-banner {
      background: #000000;
      border-top: 2px solid #ffffff;
    }

    .btn-accept {
      background: #ffffff;
      color: #000000;
    }

    .btn-reject {
      border-color: #ffffff;
      color: #ffffff;
    }
  }
</style>
