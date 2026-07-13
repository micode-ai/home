<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import PrivacyPolicyPage from './components/PrivacyPolicyPage.svelte';
  import Footer from './components/Footer.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import { loadTranslations } from './services/i18n';
  import { initializeAnalytics } from './services/analytics';
  import { getItem } from './services/storage';
  import { initScrollReveal } from './services/scrollReveal';

  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';
  import ruTranslations from './data/ru.json';

  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });

  onMount(() => {
    if (getItem('cookieConsent') === 'accepted') {
      initializeAnalytics();
    }
    return initScrollReveal();
  });
</script>

<Header />
<main id="main-content">
  <PrivacyPolicyPage />
</main>
<Footer />
<CookieBanner />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  }
  main { width: 100%; }
</style>
