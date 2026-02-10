<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import ngxChatImage from '../assets/images/ngx-open-web-ui-chat.png';
  import accountingAiImage from '../assets/images/accounting-ai.png';

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
    website?: string;
    features?: string[];
    links: ProductLink[];
  }

  const products: Product[] = productsData;

  const productImages: Record<string, string> = {
    'ngx-chat': ngxChatImage,
    'accounting-ai': accountingAiImage
  };

  let selectedProduct: Product | null = null;

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

<svelte:window on:keydown={handleKeydown} />

<section class="products scroll-reveal" aria-labelledby="products-title">
  <div class="products-container">
    <h2 id="products-title" class="products-title">{sectionTitle}</h2>

    <div class="products-grid">
      {#each products as product (product.id)}
        <div
          class="product-card"
          role="button"
          tabindex="0"
          on:click={(e) => handleCardClick(e, product)}
          on:keydown={(e) => handleCardKeydown(e, product)}
          aria-label="{t(product.nameKey, currentLanguage)} - click for details"
        >
          {#if productImages[product.id]}
            <div class="product-image-container">
              <img
                src={productImages[product.id]}
                alt={t(product.nameKey, currentLanguage)}
                class="product-image"
                loading="lazy"
              />
            </div>
          {/if}

          <div class="product-content">
            <h3 class="product-name">{t(product.nameKey, currentLanguage)}</h3>
            {#if product.website}
              <div class="product-website">{product.website}</div>
            {/if}
            <p class="product-description">{t(product.descriptionKey, currentLanguage)}</p>

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
                    {t(link.labelKey, currentLanguage)}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
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
    >
      <button
        class="modal-close"
        on:click={closeModal}
        aria-label="Close modal"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

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
        <h3 id="modal-title" class="modal-title">{t(selectedProduct.nameKey, currentLanguage)}</h3>
        {#if selectedProduct.website}
          <div class="modal-website">{selectedProduct.website}</div>
        {/if}

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
  .products {
    background: var(--color-bg-primary);
    padding: 5rem 0;
  }

  .products-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
  }

  .products-title {
    margin: 0 0 3rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .product-card {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }

  .product-card:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .product-image-container {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: var(--color-bg-tertiary);
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform var(--transition-base);
    padding: 0.5rem;
  }

  .product-card:hover .product-image {
    transform: scale(1.03);
  }

  .product-content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .product-name {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
  }

  .product-website {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  .product-description {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    flex-grow: 1;
  }

  .product-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: auto;
  }

  .product-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1.25rem;
    background: var(--color-primary);
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    font-size: 0.875rem;
    transition: background var(--transition-base);
    z-index: 1;
  }

  .product-link:hover {
    background: var(--color-primary-dark);
  }

  .product-link:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
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

  .modal-close {
    position: absolute;
    top: 1rem; right: 1rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    width: 36px;
    height: 36px;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-base), color var(--transition-base);
    z-index: 1;
  }

  .modal-close:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
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

  .modal-title {
    margin: 0 0 0.5rem 0;
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-primary);
  }

  .modal-website {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  .modal-description {
    margin: 0 0 2rem 0;
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
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
  }

  .modal-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    font-size: 1rem;
    transition: background var(--transition-base);
  }

  .modal-link:hover {
    background: var(--color-primary-dark);
  }

  .modal-link:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    .products {
      padding: 3rem 0;
    }

    .products-container {
      padding: 0 1rem;
    }

    .products-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .product-image-container {
      height: 150px;
    }

    .product-content {
      padding: 1.5rem;
    }

    .product-name {
      font-size: 1.25rem;
    }

    .product-description {
      font-size: 0.9375rem;
    }

    .product-link {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
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

    .product-image-container {
      height: 180px;
    }

    .modal-image-container {
      height: 350px;
    }
  }

  @media (prefers-color-scheme: dark) {
    .product-card {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .product-card:hover {
      background: var(--color-bg-tertiary);
    }

    .product-image-container {
      background: var(--color-bg-tertiary);
    }

    .modal-overlay {
      background: rgba(0, 0, 0, 0.7);
    }

    .modal-content {
      background: var(--color-bg-primary);
      border-color: var(--color-border);
    }

    .modal-close {
      background: var(--color-bg-tertiary);
      border-color: var(--color-border);
    }

    .modal-image-container {
      background: var(--color-bg-tertiary);
    }
  }

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

    .modal-content {
      border: 3px solid #000000;
    }

    .modal-link {
      background: #000000;
      color: #ffffff;
    }
  }

  @media print {
    .products {
      background: #ffffff;
      padding: 1rem 0;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
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

    .modal-overlay {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .product-card,
    .product-image,
    .product-link,
    .modal-link {
      transition: none;
    }

    .product-card:hover {
      transform: none;
    }

    .product-card:hover .product-image {
      transform: none;
    }
  }
</style>
