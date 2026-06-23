<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import logoUrl from '../assets/images/mi_code_logo_mark.svg';
  import { darkModeStore } from '../stores/darkModeStore';

  const companyName = $derived(t('header.companyName', $languageStore));

  const navLinks = [
    { key: 'nav.services', href: '/#services' },
    { key: 'nav.products', href: '/#products' },
    { key: 'nav.contact',  href: '/#contact'  },
  ];

  let activeSection = $state('');
  let menuOpen = $state(false);
  let observerCleanup: (() => void) | null = null;

  function closeMenu() {
    menuOpen = false;
  }

  function handleNavClick(e: MouseEvent, href: string) {
    closeMenu();
    if (typeof window === 'undefined' || window.location.pathname !== '/') return;
    const sectionId = href.replace('/#', '');
    const target = document.getElementById(sectionId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onMount(() => {
    darkModeStore.init();

    const sectionIds = ['services', 'products', 'contact'];
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeSection = `/#${entry.target.id}`;
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach(el => observer.observe(el));
    observerCleanup = () => observer.disconnect();
  });

  onDestroy(() => {
    observerCleanup?.();
  });
</script>

<header class="header">
  <div class="header-container">
    <div class="header-brand">
      <a href="/" aria-label="{companyName} — home">
        <img src={logoUrl} alt="{companyName} logo" class="header-logo" />
      </a>
    </div>

    <!-- Desktop nav -->
    <nav class="header-nav" aria-label={t('nav.menu', $languageStore)}>
      {#each navLinks as link}
        <a
          href={link.href}
          class="nav-link"
          class:active={activeSection === link.href}
          aria-current={activeSection === link.href ? 'page' : undefined}
          onclick={e => handleNavClick(e, link.href)}
        >
          {t(link.key, $languageStore)}
        </a>
      {/each}
      <a href="/blog/" class="nav-link">{t('nav.blog', $languageStore)}</a>
    </nav>

    <div class="header-right">
      <button
        type="button"
        class="theme-toggle"
        onclick={() => darkModeStore.toggle()}
        aria-label={$darkModeStore ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={$darkModeStore}
        title={$darkModeStore ? 'Light mode' : 'Dark mode'}
      >
        {#if $darkModeStore}
          <!-- Sun icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {:else}
          <!-- Moon icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </button>

      <!-- Hamburger (mobile only) -->
      <button
        type="button"
        class="hamburger"
        aria-label={menuOpen
          ? t('nav.menuClose', $languageStore)
          : t('nav.menu', $languageStore)}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onclick={() => (menuOpen = !menuOpen)}
      >
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <LanguageSwitcher />
    </div>
  </div>

  <!-- Mobile nav panel -->
  {#if menuOpen}
    <nav
      id="mobile-nav"
      class="mobile-nav"
      aria-label={t('nav.menu', $languageStore)}
    >
      {#each navLinks as link}
        <a
          href={link.href}
          class="mobile-nav-link"
          class:active={activeSection === link.href}
          aria-current={activeSection === link.href ? 'page' : undefined}
          onclick={e => handleNavClick(e, link.href)}
        >
          {t(link.key, $languageStore)}
        </a>
      {/each}
      <a href="/blog/" class="mobile-nav-link">{t('nav.blog', $languageStore)}</a>
    </nav>
  {/if}
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    transition: box-shadow var(--transition-base);
  }

  .header:hover {
    box-shadow: var(--shadow-md);
  }

  .header-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-logo {
    height: 56px;
    width: auto;
    display: block;
  }

  /* Desktop nav — sits between logo and right group */
  .header-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    justify-content: center;
  }

  .nav-link {
    position: relative;
    padding: 0.4rem 0.75rem;
    font-family: var(--font-heading);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: color var(--transition-fast), background-color var(--transition-fast);
    white-space: nowrap;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.75rem;
    right: 0.75rem;
    height: 2px;
    background: var(--color-primary);
    border-radius: 1px;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--color-primary);
    background: var(--color-bg-tertiary);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .nav-link.active {
    color: var(--color-primary);
    font-weight: 600;
  }

  .nav-link.active::after {
    transform: scaleX(1);
  }

  /* Right-side group: hamburger + language switcher */
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* Hamburger — hidden on desktop */
  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background-color var(--transition-fast);
  }

  .hamburger:hover {
    background: var(--color-bg-tertiary);
  }

  .hamburger:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .hamburger-bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--color-text-secondary);
    border-radius: 1px;
    transition: background-color var(--transition-fast);
  }

  .hamburger:hover .hamburger-bar {
    background: var(--color-primary);
  }

  /* Mobile nav panel */
  .mobile-nav {
    border-top: 1px solid var(--color-border);
    padding: 0.5rem 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mobile-nav-link {
    display: block;
    padding: 0.625rem 0.75rem;
    font-family: var(--font-heading);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: color var(--transition-fast), background-color var(--transition-fast);
  }

  .mobile-nav-link:hover {
    color: var(--color-primary);
    background: var(--color-bg-tertiary);
  }

  .mobile-nav-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .mobile-nav-link.active {
    color: var(--color-primary);
    font-weight: 600;
    background: var(--color-bg-tertiary);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);
    flex-shrink: 0;
  }

  .theme-toggle:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* ── Responsive ── */

  @media (max-width: 767px) {
    .header-logo {
      height: 40px;
    }

    .header-container {
      padding: 0.75rem 1rem;
      gap: 0.5rem;
    }

    /* Hide desktop nav, show hamburger */
    .header-nav {
      display: none;
    }

    .hamburger {
      display: flex;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .header-container {
      padding: 1rem 1.5rem;
    }

    .nav-link {
      padding: 0.4rem 0.5rem;
      font-size: 0.85rem;
    }
  }

  /* ── Dark mode ── */

  @media (prefers-color-scheme: dark) {
    .header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom-color: var(--color-border);
    }

    .header-logo {
      filter: invert(1) hue-rotate(180deg);
    }

    .nav-link {
      color: var(--color-text-tertiary);
    }

    .nav-link:hover,
    .nav-link.active {
      color: var(--color-primary-light);
      background: rgba(59, 130, 246, 0.1);
    }

    .nav-link.active::after {
      background: var(--color-primary-light);
    }

    .hamburger-bar {
      background: var(--color-text-tertiary);
    }

    .hamburger:hover .hamburger-bar {
      background: var(--color-primary-light);
    }

    .mobile-nav {
      border-top-color: var(--color-border);
    }

    .mobile-nav-link {
      color: var(--color-text-tertiary);
    }

    .mobile-nav-link:hover,
    .mobile-nav-link.active {
      color: var(--color-primary-light);
      background: rgba(59, 130, 246, 0.1);
    }
  }

  /* ── High contrast ── */

  @media (prefers-contrast: high) {
    .header {
      border-bottom: 2px solid #000000;
      background: #ffffff;
    }

    .nav-link,
    .mobile-nav-link {
      font-weight: 600;
    }

    .nav-link.active,
    .mobile-nav-link.active {
      text-decoration: underline;
    }
  }

  /* ── Reduced motion ── */

  @media (prefers-reduced-motion: reduce) {
    .nav-link::after {
      transition: none;
    }

    .nav-link,
    .mobile-nav-link,
    .hamburger,
    .hamburger-bar {
      transition: none;
    }
  }

  /* ── Print ── */

  @media print {
    .header {
      position: static;
      box-shadow: none;
      border-bottom: 2px solid #000;
    }

    .header-nav,
    .hamburger,
    .mobile-nav {
      display: none;
    }
  }
</style>
