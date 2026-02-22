<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  const dispatch = createEventDispatcher<{ openPrivacyPolicy: void }>();

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: copyright = t('footer.copyright', currentLanguage);
  $: address = t('footer.address', currentLanguage);
  $: privacyPolicyLabel = t('footer.privacyPolicy', currentLanguage);
</script>

<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <p class="footer-copyright">{copyright}</p>
      <address class="footer-address">{address}</address>
      <button class="footer-privacy-link" on:click={() => dispatch('openPrivacyPolicy')}>
        {privacyPolicyLabel}
      </button>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: var(--color-bg-hero);
    color: #ffffff;
    padding: 2rem 0;
    margin-top: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .footer-content {
    text-align: center;
  }

  .footer-copyright {
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
  }

  .footer-address {
    margin: 0;
    font-size: 0.875rem;
    font-style: normal;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
  }

  .footer-privacy-link {
    display: inline-block;
    margin-top: 0.625rem;
    background: transparent;
    border: none;
    padding: 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  .footer-privacy-link:hover {
    color: rgba(255, 255, 255, 0.85);
  }

  .footer-privacy-link:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
    border-radius: 2px;
  }

  @media (max-width: 767px) {
    .footer {
      padding: 1.5rem 0;
    }

    .footer-container {
      padding: 0 1rem;
    }

    .footer-copyright {
      font-size: 0.875rem;
    }

    .footer-address {
      font-size: 0.8125rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .footer {
      background: var(--color-bg-hero);
    }
  }

  @media (prefers-contrast: high) {
    .footer {
      background: #000000;
      border-top: 2px solid #ffffff;
    }

    .footer-copyright,
    .footer-address {
      color: #ffffff;
      font-weight: 600;
    }
  }

  @media print {
    .footer {
      background: #ffffff;
      color: #000000;
      border-top: 2px solid #000000;
    }

    .footer-copyright,
    .footer-address {
      color: #000000;
    }
  }
</style>
