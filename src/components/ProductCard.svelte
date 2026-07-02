<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import type { Product } from '../types/products';
  import CommunityStatBadges from './CommunityStatBadges.svelte';

  interface Props {
    product: Product;
    productImage: string | undefined;
    index: number;
    onOpenModal: (product: Product) => void;
  }

  const { product, productImage, index, onOpenModal }: Props = $props();

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.product-link')) return;
    onOpenModal(product);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenModal(product);
    }
  }
</script>

<div
  class="product-card"
  role="button"
  tabindex="0"
  onclick={handleClick}
  onkeydown={handleKeydown}
  aria-label="{t(product.nameKey, $languageStore)} - click for details"
  style="--card-accent: {product.accentColor ?? 'var(--color-primary)'}; --card-index: {index}"
>
  <div class="card-accent-line"></div>

  {#if productImage}
    <div class="product-image-container">
      <img
        src={productImage}
        alt={t(product.nameKey, $languageStore)}
        class="product-image"
        width="415"
        height="900"
        loading="lazy"
      />
      {#if product.badge}
        <span class="product-badge">
          {#if product.badge.icon === 'code'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          {:else if product.badge.icon === 'cloud'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
          {:else if product.badge.icon === 'smartphone'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          {/if}
          {product.badge.label}
        </span>
      {/if}
    </div>
  {/if}

  <div class="product-content">
    <h3 class="product-name">{t(product.nameKey, $languageStore)}</h3>
    {#if product.website}
      <a
        href={product.website}
        class="product-website"
        target="_blank"
        rel="noopener noreferrer"
        onclick={(e) => e.stopPropagation()}
      >
        {product.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
      </a>
    {/if}
    <p class="product-description">{t(product.descriptionKey, $languageStore)}</p>

    <CommunityStatBadges stats={product.communityStats} />

    {#if product.pricingKey}
      <div class="product-pricing">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></svg>
        {t(product.pricingKey, $languageStore)}
      </div>
    {/if}

    <div class="product-footer">
      <div class="product-footer-left">
        {#if product.links && product.links.length > 0}
          <div class="product-links">
            {#each product.links as link}
              <a
                href={link.url}
                class="product-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{t(link.labelKey, $languageStore)} for {t(product.nameKey, $languageStore)}"
                onclick={(e) => e.stopPropagation()}
              >
                {#if link.type === 'npm'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
                {:else if link.type === 'demo'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h20v14H2z"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                {:else if link.type === 'github'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {:else if link.type === 'website'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {:else if link.type === 'playStore'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                {/if}
                {t(link.labelKey, $languageStore)}
                <svg class="link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            {/each}
          </div>
        {/if}

        <a
          href="/products/{product.id}/"
          class="product-page-link"
          aria-label="View {t(product.nameKey, $languageStore)} full product page"
          onclick={(e) => e.stopPropagation()}
        >
          Full page →
        </a>
      </div>

      <button
        class="card-details-hint"
        tabindex="-1"
        aria-hidden="true"
      >
        {t('products.cardDetailsHint', $languageStore)}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
  </div>
</div>

<style>
  /* ===== Card ===== */
  .product-card {
    background: var(--color-bg-primary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-slow), box-shadow var(--transition-slow), border-color var(--transition-slow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    height: 100%;
  }

  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-xl);
    border-color: var(--card-accent, var(--color-primary));
  }

  .product-card:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .card-accent-line {
    height: 3px;
    background: var(--card-accent, var(--color-primary));
    width: 100%;
    flex-shrink: 0;
  }

  /* ===== Image ===== */
  .product-image-container {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: var(--color-bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform var(--transition-slow);
    padding: 1rem;
  }

  .product-card:hover .product-image {
    transform: scale(1.05);
  }

  /* ===== Badge ===== */
  .product-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3125rem 0.625rem;
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  /* ===== Content ===== */
  .product-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .product-name {
    margin: 0 0 0.375rem 0;
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
  }

  .product-website {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0 0 0.625rem 0;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
    width: fit-content;
  }

  .product-website:hover {
    color: var(--color-primary-dark);
  }

  .product-website:visited {
    color: var(--color-primary);
  }

  .product-description {
    margin: 0 0 0.625rem 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    flex-grow: 1;
  }

  /* ===== Pricing ===== */
  .product-pricing {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0 0 1.25rem 0;
    padding: 0.4375rem 0.75rem;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    line-height: 1.4;
    width: fit-content;
  }

  .product-pricing svg {
    color: var(--card-accent, var(--color-primary));
    flex-shrink: 0;
  }

  /* ===== Footer ===== */
  .product-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: auto;
  }

  .product-footer-left {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-grow: 1;
  }

  .product-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .product-page-link {
    display: inline-block;
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-base);
    width: fit-content;
  }

  .product-page-link:hover {
    text-decoration: underline;
    color: var(--color-primary-dark);
  }

  .product-page-link:visited {
    color: var(--color-primary);
  }

  .product-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: var(--card-accent, var(--color-primary));
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.8125rem;
    transition: opacity var(--transition-base), transform var(--transition-base);
    z-index: 1;
  }

  .product-link:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .product-link:visited {
    color: #ffffff;
  }

  .product-link:focus {
    outline: 2px solid var(--card-accent, var(--color-primary));
    outline-offset: 2px;
  }

  .product-link .link-arrow {
    transition: transform var(--transition-base);
  }

  .product-link:hover .link-arrow {
    transform: translateX(2px);
  }

  /* ===== Details hint ===== */
  .card-details-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    color: var(--color-text-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--transition-base), border-color var(--transition-base);
    min-height: auto;
    min-width: auto;
  }

  .product-card:hover .card-details-hint {
    color: var(--card-accent, var(--color-primary));
    border-color: var(--card-accent, var(--color-primary));
  }

  /* ===== Responsive — Mobile ===== */
  @media (max-width: 767px) {
    .product-image-container {
      height: 160px;
    }

    .product-content {
      padding: 1.25rem;
    }

    .product-name {
      font-size: 1rem;
    }

    .product-description {
      font-size: 0.8125rem;
    }

    .product-link {
      padding: 0.5rem 0.875rem;
      font-size: 0.75rem;
    }

    .product-footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .product-footer-left {
      width: 100%;
    }
  }

  /* ===== Responsive — Tablet ===== */
  @media (min-width: 768px) and (max-width: 1024px) {
    .product-image-container {
      height: 180px;
    }
  }

  /* ===== Dark Mode ===== */
  :global(html.dark-mode-active) .product-card {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .product-card:hover {
    background: var(--color-bg-secondary);
    border-color: var(--card-accent, var(--color-primary));
  }

  :global(html.dark-mode-active) .product-image-container {
    background: var(--color-bg-tertiary);
  }

  :global(html.dark-mode-active) .product-badge {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .card-details-hint {
    color: var(--color-text-tertiary);
    border-color: var(--color-border);
  }

  /* ===== High Contrast ===== */
  @media (prefers-contrast: high) {
    .product-card {
      border: 2px solid #000000;
      box-shadow: none;
    }

    .product-name {
      color: #000000;
      font-weight: 700;
    }

    .product-link {
      background: #000000;
      color: #ffffff;
    }

    .product-badge {
      border: 2px solid #000000;
    }

    .card-accent-line {
      height: 4px;
      background: #000000;
    }
  }

  /* ===== Print ===== */
  @media print {
    .product-card {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .product-card:hover {
      transform: none;
    }

    .product-name {
      color: #000000;
    }

    .product-link {
      background: #ffffff;
      color: #000000;
      border: 1px solid #000000;
    }

    .card-details-hint {
      display: none;
    }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .product-card,
    .product-image,
    .product-link,
    .product-link .link-arrow,
    .card-details-hint {
      transition: none;
    }

    .product-card:hover {
      transform: none;
    }

    .product-card:hover .product-image {
      transform: none;
    }

    .product-link:hover {
      transform: none;
    }

    .product-link:hover .link-arrow {
      transform: none;
    }
  }
</style>
