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

  // Load translations
  loadTranslations({ pl: plTranslations, en: enTranslations });

  // Scroll reveal observer
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
  <hr class="section-divider" aria-hidden="true" />
  <CompanyInfo />
  <hr class="section-divider" aria-hidden="true" />
  <Services />
  <hr class="section-divider" aria-hidden="true" />
  <FounderProfile />
  <hr class="section-divider" aria-hidden="true" />
  <CommunityContributions />
  <hr class="section-divider" aria-hidden="true" />
  <OwnProducts />
  <hr class="section-divider" aria-hidden="true" />
  <ContactForm />
</main>

<Footer />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  main {
    width: 100%;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    main {
      padding: 0;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    main {
      padding: 0;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    main {
      padding: 0;
    }
  }
</style>
