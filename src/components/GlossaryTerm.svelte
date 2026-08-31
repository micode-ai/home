<script lang="ts">
  // Dotted-underline inline glossary term. See docs/contracts/blog-jargon-glossary-tooltips.md —
  // the tooltip stays in the DOM at all times (never `display:none`/`visibility:hidden`) so
  // `aria-describedby` keeps working for screen readers regardless of the sighted-user open state.
  let { termId, text, definition }: { termId: string; text: string; definition: string } = $props();

  // Deterministic from `termId` (article-unique per the first-occurrence rule), not random — this
  // id is needed on the initial server-rendered markup, before any client-only code runs. `$derived`
  // rather than a plain `const` so it stays correct if Svelte reuses this component instance for a
  // different `termId` (e.g. an unkeyed `{#each}` position reused after a language switch).
  const tipId = $derived(`glossary-tip-${termId}`);

  let open = $state(false);

  function show() {
    open = true;
  }
  function hide() {
    open = false;
  }
  function toggle() {
    open = !open;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<span class="glossary-term-wrap">
  <button
    type="button"
    class="glossary-term"
    aria-describedby={tipId}
    aria-expanded={open}
    onmouseenter={show}
    onmouseleave={hide}
    onfocus={show}
    onblur={hide}
    onclick={toggle}
    onkeydown={onKeydown}
  >{text}</button>
  <span id={tipId} role="tooltip" class="glossary-tooltip" class:visible={open}>{definition}</span>
</span>

<style>
  .glossary-term-wrap {
    position: relative;
    display: inline-block;
  }
  .glossary-term {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: help;
    text-decoration: underline dotted;
    text-underline-offset: 0.2em;
  }
  .glossary-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, -0.4rem);
    width: max-content;
    max-width: 240px;
    padding: 0.6rem 0.75rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 0.5rem);
    color: var(--color-text-secondary, #475569);
    font-size: 0.8125rem;
    line-height: 1.5;
    text-align: left;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: var(--z-dropdown, 20);
  }
  .glossary-tooltip.visible {
    opacity: 1;
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .glossary-tooltip {
      transition: none;
    }
  }
</style>
