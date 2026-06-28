<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { src, alt, onClose }: { src: string; alt: string; onClose: () => void } = $props();

  onMount(() => { document.body.style.overflow = 'hidden'; });
  onDestroy(() => { document.body.style.overflow = ''; });

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
  class="lb-overlay"
  onclick={onClose}
  role="dialog"
  aria-modal="true"
  aria-label={alt}
  tabindex="-1"
>
  <button class="lb-close" onclick={onClose} aria-label="Close">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  </button>

  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div class="lb-img-wrap" onclick={(e) => e.stopPropagation()}>
    <img class="lb-img" {src} {alt} />
  </div>
</div>

<style>
  .lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(0, 0, 0, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    animation: lb-fade-in 0.18s ease;
  }

  @keyframes lb-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .lb-close {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    z-index: 9001;
  }

  .lb-close:hover { background: rgba(255, 255, 255, 0.3); }

  .lb-img-wrap {
    max-width: min(90vw, 1200px);
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lb-img {
    display: block;
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    animation: lb-zoom-in 0.2s ease;
  }

  @keyframes lb-zoom-in {
    from { transform: scale(0.92); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
</style>
