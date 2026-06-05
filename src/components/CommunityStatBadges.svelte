<script lang="ts">
  import type { CommunityStats } from '../types/products';

  interface Props {
    stats: CommunityStats | null | undefined;
    size?: 'sm' | 'md';
  }

  const { stats, size = 'sm' }: Props = $props();

  function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  const githubStars = $derived((stats?.githubStars ?? 0) > 0 ? stats!.githubStars! : null);
  const npmDownloads = $derived((stats?.npmWeeklyDownloads ?? 0) > 0 ? stats!.npmWeeklyDownloads! : null);
  const hasAny = $derived(githubStars !== null || npmDownloads !== null);
</script>

{#if hasAny}
  <div class="stat-badges stat-badges--{size}" aria-label="Community metrics">
    {#if githubStars !== null}
      <span
        class="stat-badge stat-badge--github"
        aria-label="{githubStars} GitHub stars"
        title="{githubStars} GitHub stars"
      >
        <svg
          class="stat-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="stat-value">{formatCount(githubStars)}</span>
      </span>
    {/if}
    {#if npmDownloads !== null}
      <span
        class="stat-badge stat-badge--npm"
        aria-label="{npmDownloads} weekly npm downloads"
        title="{npmDownloads} weekly npm downloads"
      >
        <svg
          class="stat-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
        <span class="stat-value">{formatCount(npmDownloads)}</span>
      </span>
    {/if}
  </div>
{/if}

<style>
  .stat-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1.4;
    white-space: nowrap;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .stat-badges--md .stat-badge {
    font-size: 0.8125rem;
    padding: 0.3125rem 0.625rem;
    gap: 0.375rem;
  }

  .stat-badges--md .stat-icon {
    width: 14px;
    height: 14px;
  }

  .stat-badge--github {
    color: var(--color-text-secondary);
  }

  .stat-badge--github .stat-icon {
    color: #f59e0b;
  }

  .stat-badge--npm {
    color: var(--color-text-secondary);
  }

  .stat-badge--npm .stat-icon {
    color: var(--color-primary);
  }

  /* ===== Dark Mode ===== */
  @media (prefers-color-scheme: dark) {
    .stat-badge {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }
  }

  /* ===== High Contrast ===== */
  @media (prefers-contrast: high) {
    .stat-badge {
      border: 2px solid currentColor;
      background: transparent;
    }
  }

  /* ===== Print ===== */
  @media print {
    .stat-badges {
      display: none;
    }
  }
</style>
