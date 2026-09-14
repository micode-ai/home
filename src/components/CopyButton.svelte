<script lang="ts">
  import { copyToClipboard } from '../services/clipboard';

  let {
    value,
    label,
    copiedLabel,
    failedLabel
  }: { value: string; label: string; copiedLabel: string; failedLabel: string } = $props();

  let copyState = $state<'idle' | 'copied' | 'error'>('idle');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function handleClick() {
    const ok = await copyToClipboard(value);
    copyState = ok ? 'copied' : 'error';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (copyState = 'idle'), 2000);
  }

  const statusText = $derived(
    copyState === 'copied' ? copiedLabel : copyState === 'error' ? failedLabel : ''
  );
</script>

<span class="copy-button-wrap">
  <button type="button" class="copy-button" aria-label={label} onclick={handleClick}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  </button>
  <span class="copy-status" class:copy-status-error={copyState === 'error'} aria-live="polite">{statusText}</span>
</span>

<style>
  .copy-button-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    padding: 0.375rem;
    color: var(--color-text-tertiary);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: color var(--transition-base), border-color var(--transition-base), background var(--transition-base);
  }

  .copy-button:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-bg-secondary);
  }

  .copy-status {
    position: absolute;
    left: calc(100% + 0.5rem);
    white-space: nowrap;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .copy-status-error {
    color: var(--color-error);
  }

  @media (prefers-reduced-motion: reduce) {
    .copy-button {
      transition: none;
    }
  }
</style>
