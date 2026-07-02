<script lang="ts">
  // Micode Landing Page - Main Application Component
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import Hero from './components/Hero.svelte';
  import CompanyInfo from './components/CompanyInfo.svelte';
  import Services from './components/Services.svelte';
  import FounderProfile from './components/FounderProfile.svelte';
  import StatsStrip from './components/StatsStrip.svelte';
  import CommunityContributions from './components/CommunityContributions.svelte';
  import OwnProducts from './components/OwnProducts.svelte';
  import Certificates from './components/Certificates.svelte';
  import Faq from './components/Faq.svelte';
  import ContactForm from './components/ContactForm.svelte';
  import Footer from './components/Footer.svelte';
  import SEO from './components/SEO.svelte';
  import AccessibilityToolbar from './components/AccessibilityToolbar.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import PrivacyPolicyModal from './components/PrivacyPolicyModal.svelte';
  import { loadTranslations } from './services/i18n';
  import { initializeAnalytics } from './services/analytics';
  import { initializeMktai } from './services/mktai';
  import { getItem } from './services/storage';
  import { initScrollReveal } from './services/scrollReveal';

  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';
  import ruTranslations from './data/ru.json';

  let privacyPolicyOpen = $state(false);

  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });

  onMount(() => {
    if (getItem('cookieConsent') === 'accepted') {
      initializeAnalytics();
      initializeMktai();
    }

    return initScrollReveal();
  });
</script>

<SEO />
<AccessibilityToolbar />
<a href="#main-content" class="skip-to-main">Skip to main content</a>
<Header />

<main id="main-content">
  <Hero />
  <Services />
  <OwnProducts />
  <FounderProfile />
  <StatsStrip />
  <CommunityContributions />
  <Certificates />
  <CompanyInfo />
  <Faq />
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

  main {
    width: 100%;
  }

  /*
   * Background rhythm — landing page section order is:
   * Hero (dark) → Services (secondary, native) → OwnProducts → FounderProfile →
   * StatsStrip (fixed blue, native) → CommunityContributions → Certificates (primary, native) →
   * CompanyInfo → Faq (primary, native) → ContactForm (tertiary, native)
   * Each component owns its own background token; these overrides only retune
   * the alternation for sections whose native default would repeat their neighbor's band.
   */
  :global(.products) {
    background: var(--color-bg-primary) !important;
  }

  :global(.founder-profile) {
    background: var(--color-bg-secondary) !important;
  }

  :global(.community) {
    background: var(--color-bg-secondary) !important;
  }

  :global(.company-info) {
    background: var(--color-bg-secondary) !important;
  }
</style>
