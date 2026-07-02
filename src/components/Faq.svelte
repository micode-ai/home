<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  const sectionTitle = $derived(t('faq.title', $languageStore));

  const items = $derived(
    [1, 2, 3, 4].map((n) => ({
      id: `faq-${n}`,
      question: t(`faq.q${n}`, $languageStore),
      answer: t(`faq.a${n}`, $languageStore),
    }))
  );
</script>

<section class="faq scroll-reveal" aria-labelledby="faq-title">
  <div class="faq-container">
    <h2 id="faq-title" class="faq-title">{sectionTitle}</h2>

    <div class="faq-list">
      {#each items as item (item.id)}
        <details class="faq-item reveal-child">
          <summary class="faq-question">
            <span>{item.question}</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-answer">{item.answer}</p>
        </details>
      {/each}
    </div>
  </div>
</section>

<style>
  .faq {
    background: var(--color-bg-primary);
    padding: var(--section-padding);
  }

  .faq-container {
    max-width: var(--max-width-lg);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .faq-title {
    margin: 0 0 2.5rem 0;
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 0;
    overflow: hidden;
    transition: box-shadow var(--transition-base);
  }

  .faq-item:hover {
    box-shadow: var(--shadow-card);
  }

  .faq-item[open] {
    box-shadow: var(--shadow-card);
  }

  .faq-question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    font-family: var(--font-heading);
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--color-text-primary);
    cursor: pointer;
    list-style: none;
  }

  .faq-question::-webkit-details-marker {
    display: none;
  }

  .faq-question:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .faq-icon {
    flex-shrink: 0;
    color: var(--color-primary);
    transition: transform var(--transition-base);
  }

  .faq-item[open] .faq-icon {
    transform: rotate(180deg);
  }

  .faq-answer {
    margin: 0;
    padding: 0 1.5rem 1.25rem 1.5rem;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  @media (max-width: 767px) {
    .faq-container {
      padding: 0 1rem;
    }

    .faq-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .faq-question {
      padding: 1rem 1.25rem;
      font-size: 1rem;
    }

    .faq-answer {
      padding: 0 1.25rem 1rem 1.25rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .faq-container {
      padding: 0 1.5rem;
    }
  }

  :global(html.dark-mode-active) .faq-item {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  @media (prefers-contrast: high) {
    .faq-item {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .faq-question {
      color: #000000;
    }

    .faq-answer {
      color: #000000;
    }
  }

  @media print {
    .faq {
      background: #ffffff;
      padding: 1rem 0;
    }

    .faq-item {
      border: 1px solid #000000;
      box-shadow: none;
      break-inside: avoid;
    }

    .faq-item:not([open]) .faq-answer {
      display: block;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .faq-item,
    .faq-icon {
      transition: none;
    }
  }
</style>
