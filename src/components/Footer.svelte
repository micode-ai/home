<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive translations
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
    background: rgba(15, 15, 25, 0.85);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    color: #ecf0f1;
    padding: 2rem 0;
    margin-top: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .footer-content {
    text-align: center;
  }

  .footer-copyright {
    margin: 0 0 0.75rem 0;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #ecf0f1;
    line-height: 1.5;
  }

  .footer-address {
    margin: 0;
    font-size: 0.875rem;
    color: #bdc3c7;
    line-height: 1.6;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .footer {
      padding: 1.5rem 0;
    }

    .footer-container {
      padding: 0 1rem;
    }

    .footer-copyright {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .footer-address {
      font-size: 0.8125rem;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .footer {
      padding: 1.75rem 0;
    }

    .footer-container {
      padding: 0 1.5rem;
    }

    .footer-copyright {
      font-size: 0.9rem;
      margin-bottom: 0.625rem;
    }

    .footer-address {
      font-size: 0.85rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .footer {
      padding: 2rem 0;
    }

    .footer-container {
      padding: 0 2rem;
    }

    .footer-copyright {
      font-size: 0.9375rem;
    }

    .footer-address {
      font-size: 0.875rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .footer {
      background: rgba(5, 5, 15, 0.9);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .footer-copyright {
      color: #ffffff;
    }

    .footer-address {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .footer {
      background-color: #000000;
      border-top: 2px solid #ffffff;
    }

    .footer-copyright,
    .footer-address {
      color: #ffffff;
      font-weight: 600;
    }
  }

  /* Print styles */
  @media print {
    .footer {
      background-color: #ffffff;
      color: #000000;
      border-top: 2px solid #000000;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .footer-copyright,
    .footer-address {
      color: #000000;
    }
  }
</style>
