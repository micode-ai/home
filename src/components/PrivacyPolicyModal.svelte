<script lang="ts">
  import { onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';

  interface Props {
    isOpen?: boolean;
    onclose?: () => void;
  }

  const { isOpen = false, onclose }: Props = $props();

  let dialogEl: HTMLDialogElement;

  function close() {
    onclose?.();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  $effect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="privacy-policy-title"
    tabindex="-1"
    onclick={handleBackdropClick}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="privacy-policy-title" class="modal-title">
          {t('legal.privacyPolicy.title', $languageStore)}
        </h2>
        <button
          class="modal-close"
          onclick={close}
          aria-label={t('legal.privacyPolicy.close', $languageStore)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.controller', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.controllerText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.dataCollected', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.dataCollectedText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.legalBasis', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.legalBasisText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.retention', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.retentionText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.rights', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.rightsText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.cookies', $languageStore)}</h3>
          <p>{t('legal.privacyPolicy.cookiesText', $languageStore)}</p>
        </section>

        <section class="policy-section">
          <h3>{t('legal.privacyPolicy.contactTitle', $languageStore)}</h3>
          <p>
            <a href="mailto:{t('legal.privacyPolicy.contactText', $languageStore)}">
              {t('legal.privacyPolicy.contactText', $languageStore)}
            </a>
          </p>
        </section>
      </div>

      <div class="modal-footer">
        <button class="btn-close" onclick={close}>
          {t('legal.privacyPolicy.close', $languageStore)}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-content {
    background: var(--color-bg-primary, #ffffff);
    border-radius: var(--radius-2xl, 1rem);
    box-shadow: var(--shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.3));
    width: 100%;
    max-width: 640px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-family: var(--font-heading, inherit);
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    line-height: 1.3;
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary, #6b7280);
    cursor: pointer;
    border-radius: var(--radius-lg, 0.5rem);
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .modal-close:hover {
    background: var(--color-bg-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
  }

  .modal-close:focus {
    outline: 2px solid var(--color-primary, #1e40af);
    outline-offset: 2px;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .policy-section {
    margin-bottom: 1.25rem;
  }

  .policy-section:last-child {
    margin-bottom: 0;
  }

  .policy-section h3 {
    margin: 0 0 0.375rem 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
  }

  .policy-section p {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-secondary, #6b7280);
    line-height: 1.6;
  }

  .policy-section a {
    color: var(--color-primary, #1e40af);
    text-decoration: underline;
  }

  .modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .btn-close {
    padding: 0.625rem 1.5rem;
    background: var(--color-accent, #e84393);
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s;
  }

  .btn-close:hover {
    background: var(--color-accent-dark, #c0356f);
  }

  .btn-close:focus {
    outline: 2px solid var(--color-accent, #e84393);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    .modal-backdrop {
      align-items: flex-end;
      padding: 0;
    }

    .modal-content {
      max-height: 90vh;
      border-radius: var(--radius-2xl, 1rem) var(--radius-2xl, 1rem) 0 0;
      max-width: 100%;
    }
  }

  :global(html.dark-mode-active) .modal-content {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .modal-header,
  :global(html.dark-mode-active) .modal-footer {
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .modal-title,
  :global(html.dark-mode-active) .policy-section h3 {
    color: var(--color-text-primary);
  }

  :global(html.dark-mode-active) .policy-section p {
    color: var(--color-text-secondary);
  }

  :global(html.dark-mode-active) .modal-close:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  @media (prefers-contrast: high) {
    .modal-content {
      border: 2px solid #000000;
    }

    .modal-close {
      border: 1px solid currentColor;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-close,
    .btn-close {
      transition: none;
    }
  }
</style>
