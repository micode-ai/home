<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import processData from '../data/process-timeline.json';

  const sectionTitle = $derived(t('process.title', $languageStore));

  interface ProcessStep {
    id: string;
    titleKey: string;
    descriptionKey: string;
  }

  const steps: ProcessStep[] = processData;
</script>

<section class="process scroll-reveal" id="process" aria-labelledby="process-title">
  <div class="process-container">
    <h2 id="process-title" class="process-title">{sectionTitle}</h2>

    <ol class="process-steps">
      {#each steps as step, index (step.id)}
        <li class="process-step reveal-child">
          <span class="process-number" aria-hidden="true">{index + 1}</span>
          <h3 class="process-step-title">{t(step.titleKey, $languageStore)}</h3>
          <p class="process-step-description">{t(step.descriptionKey, $languageStore)}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .process {
    background: var(--color-bg-secondary);
    padding: var(--section-padding);
  }

  .process-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .process-title {
    margin: 0 0 3rem 0;
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .process-steps {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .process-step {
    position: relative;
    text-align: center;
    padding-top: 3.5rem;
  }

  .process-step::before {
    content: '';
    position: absolute;
    top: 1.25rem;
    left: calc(-50% + 1.25rem);
    width: calc(100% - 2.5rem);
    height: 2px;
    background: var(--color-border);
  }

  .process-step:first-child::before {
    display: none;
  }

  .process-number {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-bg-primary);
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1.125rem;
  }

  .process-step-title {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-heading);
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .process-step-description {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  @media (max-width: 767px) {
    .process-container {
      padding: 0 1rem;
    }

    .process-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .process-steps {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .process-step {
      padding-top: 0;
      padding-left: 3.5rem;
      text-align: left;
    }

    .process-step::before {
      top: 0;
      left: 1.25rem;
      width: 2px;
      height: calc(100% + 1rem);
    }

    .process-step:first-child::before {
      display: none;
    }

    .process-number {
      top: 0;
      left: 0;
      transform: none;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .process-container {
      padding: 0 1.5rem;
    }

    .process-title {
      font-size: 1.75rem;
      margin-bottom: 2.5rem;
    }

    .process-steps {
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem 1.5rem;
    }

    .process-step:nth-child(3n + 1)::before {
      display: none;
    }
  }

  :global(html.dark-mode-active) .process {
    background: var(--color-bg-secondary);
  }

  :global(html.dark-mode-active) .process-number {
    color: var(--color-bg-secondary);
  }

  @media (prefers-contrast: high) {
    .process-step::before {
      background: #000000;
    }

    .process-number {
      background: #000000;
      color: #ffffff;
    }
  }

  @media print {
    .process {
      background: #ffffff;
      padding: 1rem 0;
    }

    .process-steps {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .process-step::before {
      background: #000000;
    }
  }
</style>
