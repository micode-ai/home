<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale, stripLocale } from '../services/locale';
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
  let scrolled = $state(false);
  let observerCleanup: (() => void) | null = null;
  let hamburgerEl: HTMLButtonElement | undefined = $state();
  let mobileNavEl: HTMLElement | undefined = $state();

  function closeMenu(returnFocus = false) {
    const wasOpen = menuOpen;
    menuOpen = false;
    if (returnFocus && wasOpen) hamburgerEl?.focus();
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function handleNavClick(e: MouseEvent, href: string) {
    closeMenu();
    // Only intercept for smooth-scroll when we're on the home page of any locale
    // (/, /en/, /ru/). Elsewhere let the link navigate to the localized home.
    if (typeof window === 'undefined' || stripLocale(window.location.pathname) !== '') return;
    const sectionId = href.replace('/#', '');
    const target = document.getElementById(sectionId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (menuOpen && e.key === 'Escape') {
      closeMenu(true);
    }
  }

  function handleWindowClick(e: MouseEvent) {
    if (!menuOpen) return;
    const target = e.target as Node;
    if (mobileNavEl?.contains(target) || hamburgerEl?.contains(target)) return;
    closeMenu(false);
  }

  function handleScroll() {
    scrolled = window.scrollY > 0;
  }

  onMount(() => {
    darkModeStore.init();
    handleScroll();

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
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(el => observer.observe(el));
    observerCleanup = () => observer.disconnect();
  });

  onDestroy(() => {
    observerCleanup?.();
  });
</script>

<svelte:window onscroll={handleScroll} onkeydown={handleWindowKeydown} onclick={handleWindowClick} />

<header class="header" class:scrolled>
  <div class="header-container">
    <div class="header-brand">
      <a href={withLocale('/', $languageStore)} aria-label="{companyName} — home">
        <img src={logoUrl} alt="{companyName} logo" class="header-logo" width="280" height="88" />
      </a>
    </div>

    <!-- Desktop nav -->
    <nav class="header-nav" aria-label={t('nav.menu', $languageStore)}>
      {#each navLinks as link}
        <a
          href={withLocale(link.href, $languageStore)}
          class="nav-link"
          class:active={activeSection === link.href}
          aria-current={activeSection === link.href ? 'page' : undefined}
          onclick={e => handleNavClick(e, link.href)}
        >
          {t(link.key, $languageStore)}
        </a>
      {/each}
      <a href={withLocale('/blog/', $languageStore)} class="nav-link">{t('nav.blog', $languageStore)}</a>
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
        bind:this={hamburgerEl}
        aria-label={menuOpen
          ? t('nav.menuClose', $languageStore)
          : t('nav.menu', $languageStore)}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onclick={toggleMenu}
      >
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <!-- Hidden on mobile — shown in mobile-nav instead -->
      <div class="lang-desktop">
        <LanguageSwitcher />
      </div>
    </div>
  </div>

  <!-- Mobile nav panel -->
  {#if menuOpen}
    <nav
      id="mobile-nav"
      class="mobile-nav"
      bind:this={mobileNavEl}
      aria-label={t('nav.menu', $languageStore)}
    >
      {#each navLinks as link}
        <a
          href={withLocale(link.href, $languageStore)}
          class="mobile-nav-link"
          class:active={activeSection === link.href}
          aria-current={activeSection === link.href ? 'page' : undefined}
          onclick={e => handleNavClick(e, link.href)}
        >
          {t(link.key, $languageStore)}
        </a>
      {/each}
      <a href={withLocale('/blog/', $languageStore)} class="mobile-nav-link">{t('nav.blog', $languageStore)}</a>
      <!-- Language switcher at the bottom of mobile menu -->
      <div class="lang-mobile">
        <LanguageSwitcher />
      </div>
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

  .header.scrolled {
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
    width: 44px;
    height: 44px;
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

    /* Language switcher moves into mobile menu */
    .lang-desktop {
      display: none;
    }
  }

  .lang-mobile {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0.75rem 0.25rem;
    margin-top: 0.25rem;
    border-top: 1px solid var(--color-border);
  }

  /* On desktop, hide the copy inside mobile-nav */
  @media (min-width: 768px) {
    .lang-mobile {
      display: none;
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

  :global(html.dark-mode-active) .header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom-color: var(--color-border);
  }

  :global(html.dark-mode-active) .header-logo {
    filter: invert(1) hue-rotate(180deg);
  }

  :global(html.dark-mode-active) .nav-link {
    color: var(--color-text-tertiary);
  }

  :global(html.dark-mode-active) .nav-link:hover,
  :global(html.dark-mode-active) .nav-link.active {
    color: var(--color-primary-light);
    background: rgba(59, 130, 246, 0.1);
  }

  :global(html.dark-mode-active) .nav-link.active::after {
    background: var(--color-primary-light);
  }

  :global(html.dark-mode-active) .hamburger-bar {
    background: var(--color-text-tertiary);
  }

  :global(html.dark-mode-active) .hamburger:hover .hamburger-bar {
    background: var(--color-primary-light);
  }

  :global(html.dark-mode-active) .mobile-nav {
    border-top-color: var(--color-border);
  }

  :global(html.dark-mode-active) .mobile-nav-link {
    color: var(--color-text-tertiary);
  }

  :global(html.dark-mode-active) .mobile-nav-link:hover,
  :global(html.dark-mode-active) .mobile-nav-link.active {
    color: var(--color-primary-light);
    background: rgba(59, 130, 246, 0.1);
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
