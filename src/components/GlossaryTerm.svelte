<script lang="ts">
  // Dotted-underline inline glossary term. See docs/contracts/blog-jargon-glossary-tooltips.md —
  // the tooltip stays in the DOM at all times (never `display:none`/`visibility:hidden`) so
  // `aria-describedby` keeps working for screen readers regardless of the sighted-user open state.
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';

  let { termId, text, definition }: { termId: string; text: string; definition: string } = $props();

  // Deterministic from `termId` (article-unique per the first-occurrence rule), not random — this
  // id is needed on the initial server-rendered markup, before any client-only code runs. `$derived`
  // rather than a plain `const` so it stays correct if Svelte reuses this component instance for a
  // different `termId` (e.g. an unkeyed `{#each}` position reused after a language switch).
  const tipId = $derived(`glossary-tip-${termId}`);

  let open = $state(false);
  let wrapEl: HTMLElement | undefined = $state();

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
  // The tooltip holds a link, so it has to survive focus moving into it. `focusout` bubbles,
  // so this fires both when the term loses focus and when the link does; only focus landing
  // outside the whole term closes the tooltip. A null relatedTarget (focus going nowhere)
  // counts as outside.
  function onFocusOut(e: FocusEvent) {
    const next = e.relatedTarget;
    if (next instanceof Node && wrapEl?.contains(next)) return;
    open = false;
  }
</script>

<!--
  Hover and focus are tracked on the wrapper, not on the button. The tooltip is the button's
  sibling and carries the "full definition" link, so binding the open state to the button alone
  closed the tooltip the moment the pointer left the word — before it could ever reach the link.
  `mouseenter`/`mouseleave` are subtree-aware: the wrapper's `mouseleave` fires only once the
  pointer has left the button and the tooltip both.

  No ARIA role goes on this wrapper, hence the ignore below: the control is the `<button>`
  inside, which carries `aria-describedby` and `aria-expanded` and works from the keyboard on
  its own. The wrapper only widens the pointer and focus region, so a role here would make a
  screen reader announce a container that means nothing to it.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="glossary-term-wrap"
  bind:this={wrapEl}
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={onFocusOut}
  onkeydown={onKeydown}
>
  <button
    type="button"
    class="glossary-term"
    aria-describedby={tipId}
    aria-expanded={open}
    onclick={toggle}
  >{text}</button>
  <span id={tipId} role="tooltip" class="glossary-tooltip" class:visible={open}>
    {definition}
    <a class="glossary-tooltip-link" href="{withLocale('/glossary/', $languageStore)}#{termId}">{t('glossary.fullDefinitionLink', $languageStore)}</a>
  </span>
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
  /* The tooltip sits 0.4rem above the word, and that offset was a dead zone: crossing it left
     the wrapper, which closed the tooltip mid-journey to the link. This bridges the gap as part
     of the tooltip itself, so it inherits `pointer-events: none` while closed and never
     interferes with selecting the surrounding prose. */
  .glossary-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 0.4rem;
  }
  .glossary-tooltip-link {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: var(--color-primary, #1e3a8a);
    text-decoration: underline;
  }

  @media (prefers-reduced-motion: reduce) {
    .glossary-tooltip {
      transition: none;
    }
  }
</style>
