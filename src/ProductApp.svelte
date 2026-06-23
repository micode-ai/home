<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import ProductPage from './components/ProductPage.svelte';
  import Footer from './components/Footer.svelte';
  import ContactForm from './components/ContactForm.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import PrivacyPolicyModal from './components/PrivacyPolicyModal.svelte';
  import SEO from './components/SEO.svelte';
  import { loadTranslations } from './services/i18n';
  import { initializeAnalytics } from './services/analytics';
  import { initializeMktai } from './services/mktai';
  import { getItem } from './services/storage';

  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';
  import ruTranslations from './data/ru.json';

  let { productId }: { productId: string } = $props();
  let privacyPolicyOpen = $state(false);

  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });

  onMount(() => {
    if (getItem('cookieConsent') === 'accepted') {
      initializeAnalytics();
      initializeMktai();
    }
  });
</script>

<SEO />
<Header />

<main id="main-content">
  <ProductPage {productId} />
  <ContactForm />
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
  main { width: 100%; }
</style>
