<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { track } from '../services/tracking';
  import {
    matchSearchEntries,
    flattenGroupedResults,
    type SearchEntry,
    type GroupedSearchResults,
  } from '../services/searchIndex';

  // Module-level cache: fetched at most once per locale per page load, so
  // reopening the overlay or retyping a query never refetches.
  const indexCache = new Map<Language, Promise<SearchEntry[]>>();

  function loadIndex(lang: Language): Promise<SearchEntry[]> {
    let pending = indexCache.get(lang);
    if (!pending) {
      pending = fetch(`/search-index/${lang}.json`)
        .then(res => (res.ok ? (res.json() as Promise<SearchEntry[]>) : []))
        .catch(() => []);
      indexCache.set(lang, pending);
    }
    return pending;
  }

  const EMPTY_RESULTS: GroupedSearchResults = { products: [], blog: [], glossary: [] };

  let open = $state(false);
  let query = $state('');
  let entries = $state<SearchEntry[]>([]);
  let activeIndex = $state(-1);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let inputEl: HTMLInputElement | undefined = $state();

  const results = $derived(open ? matchSearchEntries(entries, query) : EMPTY_RESULTS);
  const flatResults = $derived(flattenGroupedResults(results));
  const hasQuery = $derived(query.trim() !== '');
  const hasResults = $derived(flatResults.length > 0);
  const groups = $derived(
    (
      [
        ['products', results.products],
        ['blog', results.blog],
        ['glossary', results.glossary],
      ] as [string, SearchEntry[]][]
    ).filter(([, groupEntries]) => groupEntries.length > 0)
  );

  function openOverlay() {
    open = true;
    activeIndex = -1;
    loadIndex($languageStore).then(loaded => {
      entries = loaded;
    });
    // Input isn't in the DOM until the {#if open} block renders.
    queueMicrotask(() => inputEl?.focus());
  }

  function closeOverlay() {
    open = false;
    query = '';
    activeIndex = -1;
    triggerEl?.focus();
  }

  function trackSelection(entry: SearchEntry) {
    track('quick_search_select', { result_type: entry.type, query_length: query.trim().length });
  }

  // Only used for keyboard Enter — the active result isn't a focused/clicked
  // anchor in that case, so navigation has to be triggered programmatically.
  // A real click on a result anchor is left to the browser's own href
  // navigation so ctrl/cmd/shift-click and middle-click ("open in new tab")
  // keep working.
  function navigateToEntry(entry: SearchEntry) {
    trackSelection(entry);
    window.location.href = entry.url;
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (open) closeOverlay();
      else openOverlay();
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatResults.length > 0) activeIndex = (activeIndex + 1) % flatResults.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatResults.length > 0) activeIndex = (activeIndex - 1 + flatResults.length) % flatResults.length;
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < flatResults.length) {
        e.preventDefault();
        navigateToEntry(flatResults[activeIndex]);
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeOverlay();
  }

  $effect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<button
  type="button"
  class="search-trigger"
  bind:this={triggerEl}
  onclick={openOverlay}
  aria-label={t('search.trigger', $languageStore)}
  title={t('search.trigger', $languageStore)}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
</button>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div
    class="search-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quick-search-title"
    tabindex="-1"
    onclick={handleBackdropClick}
  >
    <div class="search-panel">
      <h2 id="quick-search-title" class="visually-hidden">{t('search.trigger', $languageStore)}</h2>
      <div class="search-input-row">
        <input
          type="search"
          class="search-input"
          bind:this={inputEl}
          bind:value={query}
          placeholder={t('search.placeholder', $languageStore)}
        />
        <button
          type="button"
          class="search-close"
          onclick={closeOverlay}
          aria-label={t('search.close', $languageStore)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {#if hasQuery && !hasResults}
        <p class="search-empty">{t('search.empty', $languageStore)}</p>
      {:else if hasResults}
        <div class="search-results">
          {#each groups as [groupKey, groupEntries] (groupKey)}
            <div class="search-group">
              <h3 class="search-group-title">{t(`search.group.${groupKey}`, $languageStore)}</h3>
              <ul class="search-group-list">
                {#each groupEntries as entry (entry.type + entry.id)}
                  <li>
                    <a
                      href={entry.url}
                      class="search-result"
                      class:active={flatResults[activeIndex] === entry}
                      onmouseenter={() => (activeIndex = flatResults.indexOf(entry))}
                      onclick={() => trackSelection(entry)}
                    >
                      <span class="search-result-title">{entry.title}</span>
                      <span class="search-result-summary">{entry.summary}</span>
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .search-trigger {
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

  .search-trigger:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .search-trigger:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 50);
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 10vh 1rem 1rem;
  }

  .search-panel {
    background: var(--color-bg-primary, #ffffff);
    border-radius: var(--radius-2xl, 1rem);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 640px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .search-input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 1.0625rem;
    color: var(--color-text-primary);
    padding: 0.5rem;
  }

  .search-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-lg, 0.5rem);
    flex-shrink: 0;
  }

  .search-close:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .search-close:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .search-empty {
    padding: 1.5rem;
    margin: 0;
    color: var(--color-text-tertiary);
  }

  .search-results {
    overflow-y: auto;
    padding: 0.5rem 0;
  }

  .search-group + .search-group {
    border-top: 1px solid var(--color-border);
  }

  .search-group-title {
    margin: 0;
    padding: 0.5rem 1rem 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
  }

  .search-group-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .search-result {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: inherit;
  }

  .search-result:hover,
  .search-result.active {
    background: var(--color-bg-secondary);
  }

  .search-result:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .search-result-title {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .search-result-summary {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(html.dark-mode-active) .search-panel {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .search-trigger {
    color: var(--color-text-tertiary);
  }

  @media (prefers-reduced-motion: reduce) {
    .search-trigger {
      transition: none;
    }
  }
</style>
