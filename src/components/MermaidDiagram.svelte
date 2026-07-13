<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { definition, accentColor = 'var(--color-primary)', description = '' }: {
    definition: string;
    accentColor?: string;
    /** Plain-language summary of what the diagram shows — exposed as an accessible
     * name (role="img" + aria-label) for screen readers and non-rendering crawlers,
     * since the rendered SVG's node/edge labels alone don't convey the flow. */
    description?: string;
  } = $props();

  let diagramEl: HTMLPreElement;
  let lbContainer: HTMLDivElement;
  let error = $state('');
  let open = $state(false);

  onMount(async () => {
    try {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
      });
      diagramEl.id = 'mg-' + Math.random().toString(36).slice(2, 9);
      await mermaid.run({ nodes: [diagramEl] });
    } catch (e) {
      error = String(e);
    }
  });

  function openLightbox() {
    // Clone the already-rendered SVG and inject into lightbox container
    const srcSvg = diagramEl.querySelector('svg');
    if (!srcSvg) return;
    open = true;
    // Use rAF to ensure lbContainer exists in DOM
    requestAnimationFrame(() => {
      if (!lbContainer) return;
      lbContainer.innerHTML = '';
      const clone = srcSvg.cloneNode(true) as SVGElement;
      // Remove fixed size so it fills the container
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      clone.style.width = '100%';
      clone.style.height = 'auto';
      lbContainer.appendChild(clone);
    });
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }

  $effect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });
</script>

<svelte:window onkeydown={handleKey} />

{#if error}
  <pre class="diagram-error">{error}</pre>
{/if}

<button
  class="diagram-wrap"
  style="--accent: {accentColor}"
  onclick={openLightbox}
  title="Click to enlarge"
  aria-label={description ? `Enlarge diagram: ${description}` : 'Enlarge diagram'}
>
  <pre
    class="mermaid"
    bind:this={diagramEl}
    role={description ? 'img' : undefined}
    aria-label={description || undefined}
  >{definition}</pre>
  <span class="zoom-hint" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
    Enlarge
  </span>
</button>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div class="lb-overlay" onclick={() => (open = false)} role="dialog" aria-modal="true" tabindex="-1">
    <button class="lb-close" onclick={() => (open = false)} aria-label="Close">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="lb-content" onclick={(e) => e.stopPropagation()}>
      <div class="lb-svg-host" bind:this={lbContainer}></div>
    </div>
  </div>
{/if}

<style>
  /* ── Preview card ── */
  .diagram-wrap {
    position: relative;
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-xl, 12px);
    padding: 1.5rem 1rem 2.75rem;
    min-height: 80px;
    cursor: zoom-in;
    text-align: left;
    transition: border-color 0.18s, box-shadow 0.18s;
  }

  .diagram-wrap:hover {
    border-color: var(--accent, var(--color-primary));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .diagram-wrap:focus-visible {
    outline: 2px solid var(--accent, var(--color-primary));
    outline-offset: 2px;
  }

  .diagram-wrap :global(svg) {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
  }

  .mermaid { margin: 0; padding: 0; white-space: pre; }

  /* ── Zoom hint ── */
  .zoom-hint {
    position: absolute;
    bottom: 0.75rem;
    right: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-tertiary, #64748b);
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 99px;
    padding: 0.2rem 0.55rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s;
  }

  .diagram-wrap:hover .zoom-hint,
  .diagram-wrap:focus-visible .zoom-hint { opacity: 1; }

  /* ── Lightbox ── */
  .lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(5, 10, 20, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    animation: lb-fade 0.18s ease;
  }

  @keyframes lb-fade { from { opacity: 0; } to { opacity: 1; } }

  .lb-close {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    z-index: 9001;
  }

  .lb-close:hover { background: rgba(255, 255, 255, 0.28); }

  .lb-content {
    background: #fff;
    border-radius: 14px;
    padding: 2rem;
    width: min(96vw, 1400px);
    max-height: 92vh;
    overflow: auto;
    animation: lb-zoom 0.2s ease;
  }

  @keyframes lb-zoom {
    from { transform: scale(0.93); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  .lb-svg-host {
    width: 100%;
  }

  .lb-svg-host :global(svg) {
    display: block;
    width: 100% !important;
    height: auto !important;
    max-width: none !important;
  }

  /* ── Error ── */
  .diagram-error {
    color: var(--color-error, #ef4444);
    font-size: 0.75rem;
    padding: 0.5rem;
    background: #fff0f0;
    border-radius: 6px;
    overflow-x: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .lb-overlay, .lb-content { animation: none; }
  }
</style>
