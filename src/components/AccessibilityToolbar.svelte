<script lang="ts">
  import { onMount } from 'svelte';
  import { getItem, setItem, removeItem } from '../services/storage';

  const STORAGE_KEY = 'a11y-settings';

  let open = $state(false);
  let fontSize = $state(0); // steps: -2 to +3
  let grayscale = $state(false);
  let highContrast = $state(false);
  let negativeContrast = $state(false);
  let lightBackground = $state(false);
  let linksUnderline = $state(false);
  let readableFont = $state(false);

  let panelEl: HTMLDivElement | null = null;
  let triggerEl: HTMLButtonElement | null = null;

  function saveSettings() {
    setItem(
      STORAGE_KEY,
      JSON.stringify({ fontSize, grayscale, highContrast, negativeContrast, lightBackground, linksUnderline, readableFont })
    );
  }

  function applyToDOM() {
    const html = document.documentElement;

    html.classList.toggle('a11y-grayscale', grayscale);
    html.classList.toggle('a11y-high-contrast', highContrast);
    html.classList.toggle('a11y-negative-contrast', negativeContrast);
    html.classList.toggle('a11y-light-bg', lightBackground);
    html.classList.toggle('a11y-links-underline', linksUnderline);
    html.classList.toggle('a11y-readable-font', readableFont);

    html.style.setProperty('--a11y-font-scale', String(1 + fontSize * 0.1));
  }

  $effect(() => {
    // Depend on all state
    void [fontSize, grayscale, highContrast, negativeContrast, lightBackground, linksUnderline, readableFont];
    applyToDOM();
    saveSettings();
  });

  onMount(() => {
    const raw = getItem(STORAGE_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        fontSize = s.fontSize ?? 0;
        grayscale = s.grayscale ?? false;
        highContrast = s.highContrast ?? false;
        negativeContrast = s.negativeContrast ?? false;
        lightBackground = s.lightBackground ?? false;
        linksUnderline = s.linksUnderline ?? false;
        readableFont = s.readableFont ?? false;
      } catch {
        // ignore corrupt data
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        open = false;
        triggerEl?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (open && panelEl && !panelEl.contains(e.target as Node) && e.target !== triggerEl) {
        open = false;
      }
    }

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  function reset() {
    fontSize = 0;
    grayscale = false;
    highContrast = false;
    negativeContrast = false;
    lightBackground = false;
    linksUnderline = false;
    readableFont = false;
    document.documentElement.style.setProperty('--a11y-font-scale', '1');
    removeItem(STORAGE_KEY);
  }

  function increaseFont() {
    if (fontSize < 3) fontSize++;
  }

  function decreaseFont() {
    if (fontSize > -2) fontSize--;
  }
</script>

<div class="a11y-toolbar" class:open>
  <button
    bind:this={triggerEl}
    class="a11y-trigger"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-label="Accessibility tools"
    aria-controls="a11y-panel"
    type="button"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6c1.1 0 2.09.39 2.85 1.04L12 10.99l-2.85-.95A4.003 4.003 0 0 1 12 8zM6.5 9.5l2.72.91L8 14H4a1 1 0 0 0 0 2h4l.55 4.45a1 1 0 0 0 1.99-.2L10 16h4l-.54 4.25a1 1 0 0 0 1.99.2L16 14h4a1 1 0 0 0 0-2h-4l-1.22-3.59A4.977 4.977 0 0 1 17 12c0-.55-.09-1.08-.26-1.57L18 10l2-1.5A1 1 0 1 0 18.4 7l-1.8 1.35A6.968 6.968 0 0 0 12 7a6.97 6.97 0 0 0-4.6 1.35L5.6 7A1 1 0 1 0 4 8.5L6.5 9.5z"/>
    </svg>
  </button>

  <div
    bind:this={panelEl}
    id="a11y-panel"
    class="a11y-panel"
    role="dialog"
    aria-label="Accessibility tools"
    aria-modal="false"
    hidden={!open}
  >
    <div class="a11y-panel-header">
      <span class="a11y-panel-title">Accessibility Tools</span>
    </div>

    <ul class="a11y-options" role="list">
      <li>
        <button
          class="a11y-option"
          onclick={increaseFont}
          aria-label="Increase text size"
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </span>
          Increase Text
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          onclick={decreaseFont}
          aria-label="Decrease text size"
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </span>
          Decrease Text
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={grayscale}
          onclick={() => (grayscale = !grayscale)}
          aria-label="Toggle grayscale"
          aria-pressed={grayscale}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </span>
          Grayscale
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={highContrast}
          onclick={() => (highContrast = !highContrast)}
          aria-label="Toggle high contrast"
          aria-pressed={highContrast}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>
          </span>
          High Contrast
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={negativeContrast}
          onclick={() => (negativeContrast = !negativeContrast)}
          aria-label="Toggle negative contrast"
          aria-pressed={negativeContrast}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/></svg>
          </span>
          Negative Contrast
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={lightBackground}
          onclick={() => (lightBackground = !lightBackground)}
          aria-label="Toggle light background"
          aria-pressed={lightBackground}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </span>
          Light Background
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={linksUnderline}
          onclick={() => (linksUnderline = !linksUnderline)}
          aria-label="Toggle links underline"
          aria-pressed={linksUnderline}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </span>
          Links Underline
        </button>
      </li>
      <li>
        <button
          class="a11y-option"
          class:active={readableFont}
          onclick={() => (readableFont = !readableFont)}
          aria-label="Toggle readable font"
          aria-pressed={readableFont}
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </span>
          Readable Font
        </button>
      </li>
      <li>
        <button
          class="a11y-option a11y-reset"
          onclick={reset}
          aria-label="Reset all accessibility settings"
          type="button"
        >
          <span class="a11y-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.6"/></svg>
          </span>
          Reset
        </button>
      </li>
    </ul>
  </div>
</div>

<style>
  .a11y-toolbar {
    position: fixed;
    bottom: 2rem;
    left: 0;
    z-index: 9999;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
  }

  .a11y-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 0 8px 8px 0;
    border: none;
    background: var(--color-primary, #1E40AF);
    color: #fff;
    cursor: pointer;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .a11y-trigger:hover,
  .a11y-trigger:focus-visible {
    background: var(--color-primary-dark, #1E3A8A);
    outline: 2px solid var(--color-focus, #1E40AF);
    outline-offset: 2px;
  }

  .a11y-panel {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0 8px 8px 0;
    box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    margin-left: 2px;
    color: #1E293B;
  }

  .a11y-panel[hidden] {
    display: none;
  }

  .a11y-panel-header {
    background: var(--color-primary, #1E40AF);
    color: #fff;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .a11y-panel-title {
    display: block;
  }

  .a11y-options {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
  }

  .a11y-options li {
    margin: 0;
    padding: 0;
  }

  .a11y-option {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: #1E293B;
    font-size: 0.875rem;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    min-height: 44px;
  }

  .a11y-option:hover {
    background: #EFF6FF;
    color: var(--color-primary, #1E40AF);
  }

  .a11y-option:focus-visible {
    outline: 2px solid var(--color-focus, #1E40AF);
    outline-offset: -2px;
  }

  .a11y-option.active {
    background: #DBEAFE;
    color: var(--color-primary, #1E40AF);
    font-weight: 600;
  }

  .a11y-reset {
    border-top: 1px solid #e2e8f0;
    margin-top: 0.25rem;
    padding-top: 0.5rem;
  }

  .a11y-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: inherit;
    opacity: 0.75;
  }

  /* Mobile: move to right side if too cramped on left */
  @media (max-width: 480px) {
    .a11y-toolbar {
      bottom: 1rem;
    }
  }
</style>
