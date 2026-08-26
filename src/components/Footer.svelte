<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import SocialMedia from './SocialMedia.svelte';

  // `onopenPrivacyPolicy` is accepted (but unused) for backward compatibility with call
  // sites that still pass it — no longer invoked internally. The privacy policy is now a
  // real, crawlable page (see PrivacyPolicyPage.svelte) rather than a JS-only modal, so
  // the footer links to it directly.
  const {}: { onopenPrivacyPolicy?: () => void } = $props();

  const copyright = $derived(t('footer.copyright', $languageStore));
  const address = $derived(t('footer.address', $languageStore));
  const privacyPolicyLabel = $derived(t('footer.privacyPolicy', $languageStore));
  const blogLabel = $derived(t('nav.blog', $languageStore));
  const aboutLabel = $derived(t('footer.about', $languageStore));
  const accountingAiLabel = $derived(t('products.accountingAI.name', $languageStore));
  const budgetAssistantLabel = $derived(t('products.budgetAssistant.name', $languageStore));
</script>

<footer class="footer">
  <div class="footer-container">
    <div class="footer-content">
      <p class="footer-copyright">{copyright}</p>
      <address class="footer-address">{address}</address>
      <nav class="footer-links" aria-label={t('nav.menu', $languageStore)}>
        <a href={withLocale('/blog/o-firmie-micode/', $languageStore)}>{aboutLabel}</a>
        <a href={withLocale('/blog/', $languageStore)}>{blogLabel}</a>
        <a href={withLocale('/products/accounting-ai/', $languageStore)}>{accountingAiLabel}</a>
        <a href={withLocale('/products/budget-assistant/', $languageStore)}>{budgetAssistantLabel}</a>
        <a href={withLocale('/privacy-policy/', $languageStore)}>{privacyPolicyLabel}</a>
      </nav>
    </div>
    <SocialMedia />
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }

  .footer-content {
    text-align: left;
    flex: 1;
    min-width: 0;
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

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem 1rem;
    margin-top: 0.625rem;
  }

  .footer-links a {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  .footer-links a:hover {
    color: rgba(255, 255, 255, 0.85);
  }

  .footer-links a:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
    border-radius: 2px;
  }

  @media (max-width: 900px) {
    .footer-container {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.25rem;
    }

    .footer-links {
      justify-content: center;
    }

    .footer-content {
      text-align: center;
    }
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

  :global(html.dark-mode-active) .footer {
    background: var(--color-bg-hero);
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
