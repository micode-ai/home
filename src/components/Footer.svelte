<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: copyright = t('footer.copyright', currentLanguage);
  $: address = t('footer.address', currentLanguage);
</script>

<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <p class="footer-copyright">{copyright}</p>
      <address class="footer-address">{address}</address>
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
