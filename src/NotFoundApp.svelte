<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import PrivacyPolicyModal from './components/PrivacyPolicyModal.svelte';
  import { languageStore } from './stores/languageStore';
  import { t } from './services/i18n';
  import { withLocale } from './services/locale';
  import { loadTranslations } from './services/i18n';
  import { initializeAnalytics } from './services/analytics';
  import { getItem } from './services/storage';
  import { initScrollReveal } from './services/scrollReveal';

  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';
  import ruTranslations from './data/ru.json';

  let privacyPolicyOpen = $state(false);

  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });

  const heading = $derived(t('notFound.heading', $languageStore));
  const message = $derived(t('notFound.message', $languageStore));
  const ctaLabel = $derived(t('notFound.cta', $languageStore));

  onMount(() => {
    if (getItem('cookieConsent') === 'accepted') {
      initializeAnalytics();
    }
    return initScrollReveal();
  });
</script>

<Header />
<main id="main-content">
  <section class="not-found-page">
    <p class="not-found-code" aria-hidden="true">{heading}</p>
    <h1 class="not-found-heading">{message}</h1>
    <a class="not-found-cta" href={withLocale('/', $languageStore)}>
      {ctaLabel}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </a>
  </section>
</main>
<Footer onopenPrivacyPolicy={() => (privacyPolicyOpen = true)} />
<CookieBanner />
<PrivacyPolicyModal isOpen={privacyPolicyOpen} onclose={() => (privacyPolicyOpen = false)} />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  }

  main {
    width: 100%;
    display: flex;
  }

  .not-found-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6rem 2rem;
    max-width: var(--max-width-xl);
    margin: 0 auto;
  }

  .not-found-code {
    margin: 0;
    font-family: var(--font-heading);
    font-size: clamp(4rem, 12vw, 7rem);
    font-weight: 700;
    line-height: 1;
    color: var(--color-primary);
  }

  .not-found-heading {
    margin: 1rem 0 2.5rem;
    font-size: 1.15rem;
    font-weight: 400;
    line-height: 1.7;
    color: var(--color-text-secondary);
    max-width: 480px;
  }

  .not-found-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    font-family: var(--font-heading);
    font-size: 1.0625rem;
    font-weight: 600;
    color: #ffffff;
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-lg);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base);
    box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
    min-height: 44px;
  }

  .not-found-cta:hover {
    background: var(--color-accent-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
  }

  .not-found-cta:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
  }

  .not-found-cta:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 4px;
  }

  :global(html.dark-mode-active) .not-found-code {
    color: var(--color-primary-light);
  }

  @media (prefers-reduced-motion: reduce) {
    .not-found-cta {
      transition: none;
    }
  }
</style>
