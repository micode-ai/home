<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import IndustryPage from './components/IndustryPage.svelte';
  import Footer from './components/Footer.svelte';
  import ContactForm from './components/ContactForm.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import { loadTranslations } from './services/i18n';
  import { initializeAnalytics } from './services/analytics';
  import { initializeMktai } from './services/mktai';
  import { getItem } from './services/storage';
  import { initScrollReveal } from './services/scrollReveal';

  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';
  import ruTranslations from './data/ru.json';

  let { industryId }: { industryId: string } = $props();

  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });

  onMount(() => {
    if (getItem('cookieConsent') === 'accepted') {
      initializeAnalytics();
      initializeMktai();
    }
    return initScrollReveal();
  });
</script>

<Header />
<main id="main-content">
  <IndustryPage {industryId} />
  <ContactForm />
</main>
<Footer />
<CookieBanner />
