<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import type { Product } from '../types/products';
  import CommunityStatBadges from './CommunityStatBadges.svelte';

  interface Props {
    product: Product;
    productImage: string | undefined;
    onClose: () => void;
  }

  const { product, productImage, onClose }: Props = $props();

  onMount(() => { document.body.style.overflow = 'hidden'; });
  onDestroy(() => { document.body.style.overflow = ''; });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }

  function handleContentMousedown(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="modal-overlay"
  onclick={onClose}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="-1"
>
  <div
    class="modal-content"
    onmousedown={handleContentMousedown}
    role="document"
    style="--card-accent: {product.accentColor ?? 'var(--color-primary)'}"
  >
    <button
      class="modal-close"
      onclick={onClose}
      aria-label="Close modal"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>

    <div class="modal-accent-bar"></div>

    {#if productImage}
      <div class="modal-image-container">
        <img
          src={productImage}
          alt={t(product.nameKey, $languageStore)}
          class="modal-image"
        />
      </div>
    {/if}

    <div class="modal-body">
      <div class="modal-header">
        {#if product.badge}
          <span class="modal-badge">{product.badge.label}</span>
        {/if}
        <h3 id="modal-title" class="modal-title">{t(product.nameKey, $languageStore)}</h3>
        {#if product.website}
          <a
            href="https://{product.website}"
            class="modal-website"
            target="_blank"
            rel="noopener noreferrer"
          >
            {product.website}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
          </a>
        {/if}
        <CommunityStatBadges stats={product.communityStats} size="md" />
      </div>

      {#if product.detailedDescriptionKey}
        <div class="modal-description-detailed">
          {#each t(product.detailedDescriptionKey, $languageStore).split('\n\n') as paragraph}
            <p class="modal-paragraph">{paragraph}</p>
          {/each}
        </div>
      {:else}
        <p class="modal-description">{t(product.descriptionKey, $languageStore)}</p>
      {/if}

      {#if product.features && product.features.length > 0}
        <div class="modal-features">
          <h4 class="modal-features-heading">{t('products.modal.featuresHeading', $languageStore)}</h4>
          <ul class="modal-features-list" aria-label={t('products.modal.featuresHeading', $languageStore)}>
            {#each product.features as featureKey}
              <li class="modal-feature-item">{t(featureKey, $languageStore)}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if product.links && product.links.length > 0}
        <div class="modal-links">
          {#each product.links as link}
            <a
              href={link.url}
              class="modal-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="{t(link.labelKey, $languageStore)} for {t(product.nameKey, $languageStore)}"
            >
              {t(link.labelKey, $languageStore)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* ===== Modal ===== */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    padding: 1rem;
    overflow-y: auto;
  }

  .modal-content {
    background: var(--color-bg-primary);
    border-radius: var(--radius-2xl);
    border: 1px solid var(--color-border);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: var(--shadow-xl);
  }

  .modal-accent-bar {
    height: 4px;
    background: var(--card-accent, var(--color-primary));
    width: 100%;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  }

  .modal-close {
    position: absolute;
    top: 1.25rem; right: 1.25rem;
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    width: 40px;
    height: 40px;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base);
    z-index: 1;
    box-shadow: var(--shadow-sm);
  }

  .modal-close:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-md);
  }

  .modal-close:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .modal-image-container {
    width: 100%;
    height: 400px;
    overflow: hidden;
    background: var(--color-bg-tertiary);
  }

  .modal-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .modal-body {
    padding: 2rem;
  }

  .modal-header {
    margin-bottom: 1.5rem;
  }

  .modal-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--color-bg-tertiary);
    color: var(--card-accent, var(--color-primary));
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    margin-bottom: 0.75rem;
  }

  .modal-title {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-primary);
  }

  .modal-website {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .modal-website:hover {
    color: var(--color-primary-dark);
  }

  .modal-description {
    margin: 0 0 2rem 0;
    font-size: 1.0625rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }

  .modal-description-detailed {
    margin: 0 0 2rem 0;
  }

  .modal-paragraph {
    margin: 0 0 1.25rem 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }

  .modal-paragraph:last-child {
    margin-bottom: 0;
  }

  .modal-features {
    margin: 0 0 2rem 0;
  }

  .modal-features-heading {
    margin: 0 0 0.75rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
  }

  .modal-features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-feature-item {
    position: relative;
    padding-left: 1.25rem;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .modal-feature-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.45em;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--card-accent, var(--color-primary));
  }

  .modal-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .modal-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1.5rem;
    background: var(--card-accent, var(--color-primary));
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 1rem;
    transition: opacity var(--transition-base), transform var(--transition-base);
  }

  .modal-link:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .modal-link:visited {
    color: #ffffff;
  }

  .modal-link:focus {
    outline: 2px solid var(--card-accent, var(--color-primary));
    outline-offset: 2px;
  }

  /* ===== Responsive — Mobile ===== */
  @media (max-width: 767px) {
    .modal-image-container {
      height: 250px;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-title {
      font-size: 1.5rem;
    }

    .modal-link {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
    }
  }

  /* ===== Responsive — Tablet ===== */
  @media (min-width: 768px) and (max-width: 1024px) {
    .modal-image-container {
      height: 350px;
    }
  }

  /* ===== Dark Mode ===== */
  @media (prefers-color-scheme: dark) {
    .modal-overlay {
      background: rgba(0, 0, 0, 0.7);
    }

    .modal-content {
      background: var(--color-bg-primary);
      border-color: var(--color-border);
    }

    .modal-close {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .modal-image-container {
      background: var(--color-bg-tertiary);
    }

    .modal-badge {
      background: var(--color-bg-secondary);
    }
  }

  /* ===== High Contrast ===== */
  @media (prefers-contrast: high) {
    .modal-content {
      border: 3px solid #000000;
    }

    .modal-link {
      background: #000000;
      color: #ffffff;
    }
  }

  /* ===== Print ===== */
  @media print {
    .modal-overlay {
      display: none;
    }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .modal-link,
    .modal-close {
      transition: none;
    }

    .modal-link:hover {
      transform: none;
    }
  }
</style>
