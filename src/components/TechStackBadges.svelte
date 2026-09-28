<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  interface Props {
    stack: string[] | undefined;
    size?: 'sm' | 'md';
  }

  const { stack, size = 'sm' }: Props = $props();

  const hasStack = $derived(!!stack && stack.length > 0);
</script>

{#if hasStack}
  <div class="tech-stack tech-stack--{size}">
    <span class="tech-stack-label">{t('products.techStack.label', $languageStore)}</span>
    {#each stack as tech}
      <span class="tech-stack-badge">{tech}</span>
    {/each}
  </div>
{/if}

<style>
  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .tech-stack-label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    margin-right: 0.125rem;
  }

  .tech-stack-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1.4;
    white-space: nowrap;
  }

  .tech-stack--md .tech-stack-label {
    font-size: 0.75rem;
  }

  .tech-stack--md .tech-stack-badge {
    font-size: 0.8125rem;
    padding: 0.3125rem 0.625rem;
  }

  /* ===== Dark Mode ===== */
  :global(html.dark-mode-active) .tech-stack-badge {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  /* ===== High Contrast ===== */
  @media (prefers-contrast: high) {
    .tech-stack-badge {
      border: 2px solid currentColor;
      background: transparent;
    }
  }

  /* ===== Print ===== */
  @media print {
    .tech-stack {
      display: none;
    }
  }
</style>
