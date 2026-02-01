<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive translations
  $: headline = t('hero.headline', currentLanguage);
  $: subheadline = t('hero.subheadline', currentLanguage);
  $: ctaText = t('hero.cta', currentLanguage);

  /**
   * Scroll to contact form section
   */
  function scrollToContact() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      // Focus the first input in the contact form for keyboard users
      setTimeout(() => {
        const firstInput = contactSection.querySelector('input, textarea');
        if (firstInput instanceof HTMLElement) {
          firstInput.focus();
        }
      }, 500);
    }
  }
  
  /**
   * Handle keyboard activation (Enter/Space)
   */
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
      </button>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-hero);
    color: #ffffff;
    overflow: hidden;
  }

  /* Floating gradient orb - top left */
  .hero::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -10%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, var(--orb-purple) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    animation: float-orb 15s ease-in-out infinite;
  }

  /* Floating gradient orb - bottom right */
  .hero::after {
    content: '';
    position: absolute;
    bottom: -15%;
    right: -10%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, var(--orb-blue) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    animation: float-orb 20s ease-in-out infinite reverse;
  }

  @keyframes float-orb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-20px, 15px) scale(0.95); }
  }

  .hero-container {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 2rem;
    width: 100%;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: var(--glass-border);
    border-radius: var(--radius-glass-lg);
    padding: 3rem 3.5rem;
    box-shadow: var(--glass-shadow-elevated);
  }

  .hero-headline {
    margin: 0 0 1.5rem 0;
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.2;
    background: linear-gradient(135deg, #ffffff 0%, #93b5f5 40%, #c4a0e8 70%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: headline-shimmer 6s ease-in-out infinite;
  }

  @keyframes headline-shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .hero-subheadline {
    margin: 0 0 2.5rem 0;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .hero-cta {
    display: inline-block;
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #ffffff;
    background: var(--gradient-accent);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    min-width: 44px;
    min-height: 44px;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: glow-pulse 3s ease-in-out infinite;
  }

  .hero-cta:hover {
    background: var(--gradient-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  }

  .hero-cta:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
  }

  .hero-cta:focus {
    outline: 3px solid rgba(255, 255, 255, 0.5);
    outline-offset: 4px;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .hero {
      min-height: 400px;
    }

    .hero-container {
      padding: 3rem 1rem;
    }

    .hero-content {
      padding: 2rem 1.5rem;
    }

    .hero-headline {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .hero-subheadline {
      font-size: 1rem;
      margin-bottom: 2rem;
    }

    .hero-cta {
      padding: 0.875rem 2rem;
      font-size: 1rem;
      width: 100%;
      max-width: 300px;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .hero {
      min-height: 450px;
    }

    .hero-container {
      padding: 3.5rem 2rem;
    }

    .hero-headline {
      font-size: 2.5rem;
      margin-bottom: 1.25rem;
    }

    .hero-subheadline {
      font-size: 1.125rem;
      margin-bottom: 2.25rem;
    }

    .hero-cta {
      padding: 0.9375rem 2.25rem;
      font-size: 1.0625rem;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .hero {
      min-height: 500px;
    }

    .hero-container {
      padding: 4rem 2rem;
    }

    .hero-headline {
      font-size: 3rem;
    }

    .hero-subheadline {
      font-size: 1.25rem;
    }

    .hero-cta {
      padding: 1rem 2.5rem;
      font-size: 1.125rem;
    }
  }

  /* Large desktop styles (> 1440px) */
  @media (min-width: 1441px) {
    .hero {
      min-height: 600px;
    }

    .hero-headline {
      font-size: 3.5rem;
    }

    .hero-subheadline {
      font-size: 1.375rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .hero {
      background: var(--gradient-hero);
    }

    .hero-content {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow-elevated);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .hero-cta {
      transition: none;
    }

    .hero-cta:hover {
      transform: none;
    }

    .hero-cta:active {
      transform: none;
    }

    .hero::before,
    .hero::after {
      animation: none;
    }

    .hero-headline {
      animation: none;
    }

    .hero-cta {
      animation: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .hero {
      background: #000080;
    }

    .hero-headline,
    .hero-subheadline {
      text-shadow: none;
    }

    .hero-headline {
      background: none;
      -webkit-background-clip: unset;
      -webkit-text-fill-color: #ffffff;
      background-clip: unset;
      animation: none;
    }

    .hero-cta {
      animation: none;
    }

    .hero-cta {
      border: 2px solid #000000;
      font-weight: 700;
    }
  }

  /* Print styles */
  @media print {
    .hero {
      min-height: auto;
      background: #ffffff;
      color: #000000;
      page-break-after: avoid;
    }

    .hero::before,
    .hero::after {
      display: none;
    }

    .hero-headline,
    .hero-subheadline {
      color: #000000;
      text-shadow: none;
    }

    .hero-cta {
      display: none;
    }
  }
</style>
