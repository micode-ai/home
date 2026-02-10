<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: headline = t('hero.headline', currentLanguage);
  $: subheadline = t('hero.subheadline', currentLanguage);
  $: ctaText = t('hero.cta', currentLanguage);

  function scrollToContact() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const firstInput = contactSection.querySelector('input, textarea');
        if (firstInput instanceof HTMLElement) {
          firstInput.focus();
        }
      }, 500);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToContact();
    }
  }
</script>

<section class="hero" id="hero" aria-labelledby="hero-headline">
  <div class="hero-container">
    <div class="hero-content">
      <h1 class="hero-headline" id="hero-headline">{headline}</h1>
      <p class="hero-subheadline">{subheadline}</p>
      <button
        class="hero-cta"
        on:click={scrollToContact}
        on:keydown={handleKeydown}
        aria-label="{ctaText} - Navigate to contact form"
      >
        {ctaText}
        <svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-hero);
    color: #ffffff;
    overflow: hidden;
  }

  /* Subtle geometric accent */
  .hero::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 70%;
    height: 140%;
    background: radial-gradient(ellipse, rgba(30, 64, 175, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -15%;
    width: 50%;
    height: 100%;
    background: radial-gradient(ellipse, rgba(249, 115, 22, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-container {
    position: relative;
    z-index: 1;
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 5rem 2rem;
    width: 100%;
  }

  .hero-content {
    max-width: 720px;
    text-align: left;
  }

  .hero-headline {
    margin: 0 0 1.5rem 0;
    font-family: var(--font-heading);
    font-size: 3.25rem;
    font-weight: 700;
    line-height: 1.15;
    color: #ffffff;
  }

  .hero-subheadline {
    margin: 0 0 2.5rem 0;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.8);
    max-width: 560px;
  }

  .hero-cta {
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
    cursor: pointer;
    transition: background-color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base);
    box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
    min-height: 44px;
    min-width: 44px;
  }

  .hero-cta:hover {
    background: var(--color-accent-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
  }

  .hero-cta:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
  }

  .hero-cta:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 4px;
  }

  .cta-arrow {
    transition: transform var(--transition-base);
  }

  .hero-cta:hover .cta-arrow {
    transform: translateX(3px);
  }

  @media (max-width: 767px) {
    .hero {
      min-height: 420px;
    }

    .hero-container {
      padding: 3.5rem 1.25rem;
    }

    .hero-content {
      text-align: center;
      max-width: 100%;
    }

    .hero-headline {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .hero-subheadline {
      font-size: 1rem;
      margin-bottom: 2rem;
      max-width: 100%;
    }

    .hero-cta {
      width: 100%;
      max-width: 300px;
      justify-content: center;
      padding: 0.875rem 1.75rem;
      font-size: 1rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .hero {
      min-height: 460px;
    }

    .hero-container {
      padding: 4rem 2rem;
    }

    .hero-headline {
      font-size: 2.5rem;
    }

    .hero-subheadline {
      font-size: 1.125rem;
    }
  }

  @media (min-width: 1441px) {
    .hero {
      min-height: 600px;
    }

    .hero-headline {
      font-size: 3.75rem;
    }

    .hero-subheadline {
      font-size: 1.375rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .hero {
      background: var(--color-bg-hero);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-cta {
      transition: none;
    }

    .hero-cta:hover {
      transform: none;
    }

    .cta-arrow {
      transition: none;
    }

    .hero-cta:hover .cta-arrow {
      transform: none;
    }
  }

  @media (prefers-contrast: high) {
    .hero {
      background: #000080;
    }

    .hero-cta {
      border: 2px solid #000000;
      font-weight: 700;
    }
  }

  @media print {
    .hero {
      min-height: auto;
      background: #ffffff;
      color: #000000;
    }

    .hero::before,
    .hero::after {
      display: none;
    }

    .hero-headline,
    .hero-subheadline {
      color: #000000;
    }

    .hero-cta {
      display: none;
    }
  }
</style>
