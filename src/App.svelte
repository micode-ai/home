<script>
  // Micode Landing Page - Main Application Component
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import Hero from './components/Hero.svelte';
  import CompanyInfo from './components/CompanyInfo.svelte';
  import Services from './components/Services.svelte';
  import FounderProfile from './components/FounderProfile.svelte';
  import CommunityContributions from './components/CommunityContributions.svelte';
  import OwnProducts from './components/OwnProducts.svelte';
  import ContactForm from './components/ContactForm.svelte';
  import Footer from './components/Footer.svelte';
  import SEO from './components/SEO.svelte';
  import { loadTranslations } from './services/i18n';
  import plTranslations from './data/pl.json';
  import enTranslations from './data/en.json';

  loadTranslations({ pl: plTranslations, en: enTranslations });

  onMount(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  });
</script>

<SEO />
<a href="#main-content" class="skip-to-main">Skip to main content</a>
<Header />

<main id="main-content">
  <Hero />
  <CompanyInfo />
  <Services />
  <FounderProfile />
  <CommunityContributions />
  <OwnProducts />
  <ContactForm />
</main>

<Footer />

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
</style>
