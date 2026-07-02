<script lang="ts">
  import { onMount } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  interface StatConfig {
    key: string;
    targetValue: number;
    suffix: string;
    labelKey: string;
  }

  const STATS: StatConfig[] = [
    { key: 'experience', targetValue: 18, suffix: '+', labelKey: 'stats.experience.label' },
    { key: 'products',   targetValue: 5,  suffix: '',  labelKey: 'stats.products.label' },
    { key: 'projects',   targetValue: 30, suffix: '+', labelKey: 'stats.projects.label' },
  ];

  let displayValues = $state(STATS.map(() => 0));
  let sectionEl: HTMLElement;

  const sectionTitle = $derived(t('stats.title', $languageStore));
  const labels = $derived(STATS.map(s => t(s.labelKey, $languageStore)));

  function animateCounter(index: number, target: number, duration: number) {
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayValues[index] = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  onMount(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      displayValues = STATS.map(s => s.targetValue);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            STATS.forEach((stat, i) => animateCounter(i, stat.targetValue, 1200));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(sectionEl);
    return () => observer.disconnect();
  });
</script>

<section
  class="stats-strip scroll-reveal"
  aria-labelledby="stats-title"
  bind:this={sectionEl}
>
  <div class="stats-container">
    <h2 id="stats-title" class="stats-heading">{sectionTitle}</h2>
    <div class="stats-grid" role="list">
      {#each STATS as stat, i (stat.key)}
        <div
          class="stat-item reveal-child"
          role="listitem"
          aria-label="{displayValues[i]}{stat.suffix} {labels[i]}"
        >
          <div class="stat-value" aria-hidden="true">
            <span class="stat-number">{displayValues[i]}</span><span class="stat-suffix">{stat.suffix}</span>
          </div>
          <div class="stat-label" aria-hidden="true">{labels[i]}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .stats-strip {
    background: var(--color-band-blue);
    padding: 4rem 0;
  }

  .stats-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .stats-heading {
    text-align: center;
    font-family: var(--font-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: #ffffff;
    margin: 0 0 2.5rem 0;
    line-height: var(--line-height-tight);
    opacity: 0.9;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: var(--font-size-sm);
  }

  .stats-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1rem;
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.08);
    transition: background var(--transition-base);
    flex: 0 0 clamp(160px, 22%, 280px);
  }

  .stat-item:hover {
    background: rgba(255, 255, 255, 0.13);
  }

  .stat-value {
    display: flex;
    align-items: baseline;
    gap: 0.1em;
    line-height: 1;
    margin-bottom: 0.75rem;
  }

  .stat-number {
    font-family: var(--font-heading);
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-bold);
    color: #ffffff;
    line-height: 1;
    tabular-nums: true;
    font-variant-numeric: tabular-nums;
  }

  .stat-suffix {
    font-family: var(--font-heading);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-accent-light);
    line-height: 1;
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.8);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-medium);
    max-width: 10rem;
  }

  @media (max-width: 767px) {
    .stats-strip {
      padding: 3rem 0;
    }

    .stats-container {
      padding: 0 1rem;
    }

    .stat-number {
      font-size: var(--font-size-4xl);
    }

    .stat-suffix {
      font-size: var(--font-size-3xl);
    }

    .stat-item {
      padding: 1.25rem 0.75rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .stats-container {
      padding: 0 1.5rem;
    }

    .stats-grid {
      gap: 1.25rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-item {
      transition: none;
    }
  }

  @media (prefers-contrast: high) {
    .stats-strip {
      background: #000000;
      border: 2px solid #ffffff;
    }

    .stat-item {
      background: transparent;
      border: 1px solid #ffffff;
    }

    .stat-suffix {
      color: #ffffff;
    }
  }

  @media print {
    .stats-strip {
      background: #f0f0f0;
      padding: 1rem 0;
    }

    .stats-heading,
    .stat-number,
    .stat-suffix,
    .stat-label {
      color: #000000;
    }

    .stat-item {
      background: transparent;
      border: 1px solid #000000;
    }
  }
</style>
