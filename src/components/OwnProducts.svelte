<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import ngxChatImage from '../assets/images/ngx-open-web-ui-chat.png';
  import accountingAiImage from '../assets/images/accounting-ai.png';
  import budgetAssistantImage from '../assets/images/budget-assistant.png';
  import emarketingAiImage from '../assets/images/emarketing-ai.png';
  import testingAiImage from '../assets/images/testing-ai.png';

  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  $: sectionTitle = t('products.title', currentLanguage);

  interface ProductLink {
    type: string;
    url: string;
    labelKey: string;
  }

  interface Product {
    id: string;
    nameKey: string;
    descriptionKey: string;
    detailedDescriptionKey?: string;
    pricingKey?: string;
    website?: string;
    features?: string[];
    links: ProductLink[];
  }

  const products: Product[] = productsData;

  const productImages: Record<string, string> = {
    'ngx-chat': ngxChatImage,
    'accounting-ai': accountingAiImage,
    'emarketing-ai': emarketingAiImage,
    'budget-assistant': budgetAssistantImage,
    'testing-ai': testingAiImage
  };

  const productBadges: Record<string, { label: string; icon: string }> = {
    'ngx-chat': { label: 'Open Source', icon: 'code' },
    'accounting-ai': { label: 'SaaS', icon: 'cloud' },
    'emarketing-ai': { label: 'SaaS', icon: 'cloud' },
    'budget-assistant': { label: 'Mobile App', icon: 'smartphone' },
    'testing-ai': { label: 'SaaS', icon: 'cloud' }
  };

  const productAccentColors: Record<string, string> = {
    'ngx-chat': 'var(--color-primary)',
    'accounting-ai': 'var(--color-success)',
    'emarketing-ai': 'var(--color-info, #8b5cf6)',
    'budget-assistant': 'var(--color-accent)',
    'testing-ai': 'var(--color-warning, #f59e0b)'
  };

  let selectedProduct: Product | null = null;
  let sliderOffset = 0;

  // Desktop shows 3, tablet shows 2, mobile shows 1
  function getVisibleCount(): number {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1025) return 2;
    return 3;
  }

  let visibleCount = getVisibleCount();

  function handleResize() {
    visibleCount = getVisibleCount();
    // Clamp offset if window resized
    const maxOffset = Math.max(0, products.length - visibleCount);
    if (sliderOffset > maxOffset) sliderOffset = maxOffset;
  }

  $: maxOffset = Math.max(0, products.length - visibleCount);
  $: canPrev = sliderOffset > 0;
  $: canNext = sliderOffset < maxOffset;

  // Step shift = (100% + gap) / visibleCount; gap comes from --grid-gap so it
  // stays in sync with the CSS media queries below.
  $: sliderTransform = `translateX(calc(-${sliderOffset} * (100% + var(--grid-gap)) / ${visibleCount}))`;

  function slidePrev() {
    if (canPrev) sliderOffset--;
  }

  function slideNext() {
    if (canNext) sliderOffset++;
  }

  function slideTo(index: number) {
    sliderOffset = Math.min(index, maxOffset);
  }

  function openModal(product: Product) {
    selectedProduct = product;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    selectedProduct = null;
    document.body.style.overflow = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && selectedProduct) {
      closeModal();
    }
  }

  function handleCardClick(event: MouseEvent, product: Product) {
    const target = event.target as HTMLElement;
    if (target.closest('.product-link')) {
      return;
    }
    openModal(product);
  }

  function handleCardKeydown(event: KeyboardEvent, product: Product) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(product);
    }
  }

  function handleModalContentClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<svelte:window on:keydown={handleKeydown} on:resize={handleResize} />

<section class="products scroll-reveal" aria-labelledby="products-title">
  <div class="products-container">
    <div class="products-header">
      <div class="products-header-accent"></div>
      <h2 id="products-title" class="products-title">{sectionTitle}</h2>
      <p class="products-subtitle">
        {#if currentLanguage === 'pl'}
          Narzędzia i rozwiązania, które tworzymy
        {:else if currentLanguage === 'ru'}
          Инструменты и решения, которые мы создаём
        {:else}
          Tools and solutions we build
        {/if}
      </p>
    </div>

    <div class="slider-wrapper">
      {#if maxOffset > 0}
        <button
          class="slider-arrow slider-arrow-prev"
          on:click={slidePrev}
          disabled={!canPrev}
          aria-label="Previous products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      {/if}

      <div class="slider-viewport">
        <div
          class="products-grid"
          style="--visible-count: {visibleCount}; transform: {sliderTransform};"
        >
          {#each products as product, index (product.id)}
            <div
              class="product-card"
              class:card-primary={product.id === 'ngx-chat'}
              class:card-success={product.id === 'accounting-ai'}
              class:card-info={product.id === 'emarketing-ai'}
              class:card-accent={product.id === 'budget-assistant'}
              role="button"
              tabindex="0"
              on:click={(e) => handleCardClick(e, product)}
              on:keydown={(e) => handleCardKeydown(e, product)}
              aria-label="{t(product.nameKey, currentLanguage)} - click for details"
              style="--card-accent: {productAccentColors[product.id]}; --card-index: {index}"
            >
              <div class="card-accent-line"></div>

              {#if productImages[product.id]}
                <div class="product-image-container">
                  <img
                    src={productImages[product.id]}
                    alt={t(product.nameKey, currentLanguage)}
                    class="product-image"
                    loading="lazy"
                  />
                  {#if productBadges[product.id]}
                    <span class="product-badge">
                      {#if productBadges[product.id].icon === 'code'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      {:else if productBadges[product.id].icon === 'cloud'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                      {:else if productBadges[product.id].icon === 'smartphone'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                      {/if}
                      {productBadges[product.id].label}
                    </span>
                  {/if}
                </div>
              {/if}

              <div class="product-content">
                <h3 class="product-name">{t(product.nameKey, currentLanguage)}</h3>
                {#if product.website}
                  <a
                    href="https://{product.website}"
                    class="product-website"
                    target="_blank"
                    rel="noopener noreferrer"
                    on:click={(e) => e.stopPropagation()}
                  >
                    {product.website}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  </a>
                {/if}
                <p class="product-description">{t(product.descriptionKey, currentLanguage)}</p>

                {#if product.pricingKey}
                  <div class="product-pricing">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></svg>
                    {t(product.pricingKey, currentLanguage)}
                  </div>
                {/if}

                <div class="product-footer">
                  {#if product.links && product.links.length > 0}
                    <div class="product-links">
                      {#each product.links as link}
                        <a
                          href={link.url}
                          class="product-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="{t(link.labelKey, currentLanguage)} for {t(product.nameKey, currentLanguage)}"
                          on:click={(e) => e.stopPropagation()}
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
                          {t(link.labelKey, currentLanguage)}
                          <svg class="link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                      {/each}
                    </div>
                  {/if}

                  <button
                    class="card-details-hint"
                    tabindex="-1"
                    aria-hidden="true"
                  >
                    {#if currentLanguage === 'pl'}
                      Szczegóły
                    {:else if currentLanguage === 'ru'}
                      Подробнее
                    {:else}
                      Details
                    {/if}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      {#if maxOffset > 0}
        <button
          class="slider-arrow slider-arrow-next"
          on:click={slideNext}
          disabled={!canNext}
          aria-label="Next products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      {/if}
    </div>

    {#if maxOffset > 0}
      <div class="slider-dots" role="tablist" aria-label="Product slides">
        {#each Array(maxOffset + 1) as _, i}
          <button
            class="slider-dot"
            class:active={sliderOffset === i}
            on:click={() => slideTo(i)}
            role="tab"
            aria-selected={sliderOffset === i}
            aria-label="Go to slide {i + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</section>

{#if selectedProduct}
  <div
    class="modal-overlay"
    on:click={closeModal}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div
      class="modal-content"
      on:mousedown={handleModalContentClick}
      role="document"
      style="--card-accent: {productAccentColors[selectedProduct.id]}"
    >
      <button
        class="modal-close"
        on:click={closeModal}
        aria-label="Close modal"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div class="modal-accent-bar"></div>

      {#if productImages[selectedProduct.id]}
        <div class="modal-image-container">
          <img
            src={productImages[selectedProduct.id]}
            alt={t(selectedProduct.nameKey, currentLanguage)}
            class="modal-image"
          />
        </div>
      {/if}

      <div class="modal-body">
        <div class="modal-header">
          {#if productBadges[selectedProduct.id]}
            <span class="modal-badge">
              {productBadges[selectedProduct.id].label}
            </span>
          {/if}
          <h3 id="modal-title" class="modal-title">{t(selectedProduct.nameKey, currentLanguage)}</h3>
          {#if selectedProduct.website}
            <a
              href="https://{selectedProduct.website}"
              class="modal-website"
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedProduct.website}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            </a>
          {/if}
        </div>

        {#if selectedProduct.detailedDescriptionKey}
          <div class="modal-description-detailed">
            {#each t(selectedProduct.detailedDescriptionKey, currentLanguage).split('\n\n') as paragraph}
              <p class="modal-paragraph">{paragraph}</p>
            {/each}
          </div>
        {:else}
          <p class="modal-description">{t(selectedProduct.descriptionKey, currentLanguage)}</p>
        {/if}

        {#if selectedProduct.links && selectedProduct.links.length > 0}
          <div class="modal-links">
            {#each selectedProduct.links as link}
              <a
                href={link.url}
                class="modal-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{t(link.labelKey, currentLanguage)} for {t(selectedProduct.nameKey, currentLanguage)}"
              >
                {t(link.labelKey, currentLanguage)}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* ===== Section ===== */
  .products {
    background: var(--color-bg-primary);
    padding: 5rem 0;
    position: relative;
  }

  .products-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* ===== Header ===== */
  .products-header {
    text-align: center;
    margin-bottom: 3.5rem;
  }

  .products-header-accent {
    width: 48px;
    height: 4px;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    margin: 0 auto 1.25rem;
  }

  .products-title {
    margin: 0 0 0.75rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .products-subtitle {
    margin: 0;
    font-size: 1.0625rem;
    color: var(--color-text-tertiary);
    line-height: 1.5;
  }

  /* ===== Slider ===== */
  .slider-wrapper {
    position: relative;
  }

  .slider-viewport {
    overflow: hidden;
    width: 100%;
  }

  .products-grid {
    display: flex;
    --grid-gap: 2rem;
    gap: var(--grid-gap);
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .products-grid > .product-card {
    min-width: calc((100% - var(--grid-gap) * (var(--visible-count) - 1)) / var(--visible-count));
    max-width: calc((100% - var(--grid-gap) * (var(--visible-count) - 1)) / var(--visible-count));
    flex-shrink: 0;
  }

  .slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background var(--transition-base), color var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
    box-shadow: var(--shadow-md);
    z-index: 2;
  }

  .slider-arrow-prev {
    left: -22px;
  }

  .slider-arrow-next {
    right: -22px;
  }

  .slider-arrow:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    color: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
  }

  .slider-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .slider-arrow:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .slider-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .slider-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: background var(--transition-base), border-color var(--transition-base), transform var(--transition-base);
  }

  .slider-dot:hover {
    border-color: var(--color-primary);
    transform: scale(1.2);
  }

  .slider-dot.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .slider-dot:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

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

  /* Accent line at top of card */
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
    margin: 0 0 1.25rem 0;
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

  .product-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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
    .products {
      padding: 3rem 0;
    }

    .products-container {
      padding: 0 1rem;
    }

    .products-header {
      margin-bottom: 2rem;
    }

    .products-title {
      font-size: 1.5rem;
    }

    .products-subtitle {
      font-size: 0.9375rem;
    }

    .slider-arrow {
      width: 36px;
      height: 36px;
    }

    .slider-arrow-prev {
      left: -8px;
    }

    .slider-arrow-next {
      right: -8px;
    }

    .products-grid {
      --grid-gap: 1.5rem;
    }

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
    .products {
      padding: 4rem 0;
    }

    .products-container {
      padding: 0 1.5rem;
    }

    .products-title {
      font-size: 1.75rem;
    }

    .products-grid {
      --grid-gap: 1.5rem;
    }

    .product-image-container {
      height: 180px;
    }

    .modal-image-container {
      height: 350px;
    }
  }

  /* ===== Dark Mode ===== */
  @media (prefers-color-scheme: dark) {
    .product-card {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .product-card:hover {
      background: var(--color-bg-secondary);
      border-color: var(--card-accent, var(--color-primary));
    }

    .product-image-container {
      background: var(--color-bg-tertiary);
    }

    .product-badge {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .card-details-hint {
      color: var(--color-text-tertiary);
      border-color: var(--color-border);
    }

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

    .slider-arrow {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .slider-arrow:hover:not(:disabled) {
      background: var(--color-bg-tertiary);
    }

    .slider-dot {
      border-color: var(--color-border);
    }
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
    .products {
      background: #ffffff;
      padding: 1rem 0;
    }

    .slider-arrow,
    .slider-dots {
      display: none;
    }

    .slider-viewport {
      overflow: visible;
    }

    .products-grid {
      flex-wrap: wrap;
      transform: none !important;
      gap: 1rem;
    }

    .products-grid > .product-card {
      min-width: 100%;
      max-width: 100%;
    }

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

    .modal-overlay {
      display: none;
    }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .product-card,
    .product-image,
    .product-link,
    .product-link .link-arrow,
    .card-details-hint,
    .modal-link,
    .modal-close {
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

    .modal-link:hover {
      transform: none;
    }

    .products-grid {
      transition: none;
    }

    .slider-dot:hover {
      transform: none;
    }
  }
</style>
