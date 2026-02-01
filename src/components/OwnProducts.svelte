<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import ngxChatImage from '../assets/images/ngx-open-web-ui-chat.png';
  import accountingAiImage from '../assets/images/accounting-ai.png';

  // Subscribe to the language store
  let currentLanguage: Language;
  languageStore.subscribe(value => {
    currentLanguage = value;
  });

  // Reactive section title
  $: sectionTitle = t('products.title', currentLanguage);

  // Product interface
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

  // Load products
  const products: Product[] = productsData;

  // Image mapping
  const productImages: Record<string, string> = {
    'ngx-chat': ngxChatImage,
    'accounting-ai': accountingAiImage
  };

  // Modal state
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
    // Don't open modal if clicking on a link
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
                    {t(link.labelKey, currentLanguage)} →
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

<!-- Modal -->
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
        ×
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
                {t(link.labelKey, currentLanguage)} →
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
    background: var(--gradient-section-light);
    padding: 4rem 0;
    position: relative;
  }

  .products-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .products-title {
    margin: 0 0 3rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    text-align: center;
    line-height: 1.2;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .product-card {
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-radius: var(--radius-glass);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
  }

  .product-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--glass-shadow-hover);
    background: var(--glass-bg-strong);
  }

  .product-card:focus {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  .product-image-container {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #f0f2f5 0%, #e8edf2 100%);
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
    padding: 0.5rem;
  }

  .product-card:hover .product-image {
    transform: scale(1.05);
  }

  .product-content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .product-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .product-website {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #7f8c8d;
    font-style: italic;
  }

  .product-description {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
    flex-grow: 1;
  }

  .product-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: auto;
  }

  .product-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--gradient-accent);
    color: #ffffff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.9375rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    z-index: 1;
  }

  .product-link:hover {
    background: var(--gradient-accent-hover);
    transform: translateX(4px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .product-link:focus {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 10, 20, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    overflow-y: auto;
  }

  .modal-content {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(var(--glass-blur-strong));
    -webkit-backdrop-filter: blur(var(--glass-blur-strong));
    border-radius: var(--radius-glass-lg);
    border: var(--glass-border-strong);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: var(--glass-shadow-elevated);
    scrollbar-width: thin;
    scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
  }

  .modal-content::-webkit-scrollbar {
    width: 6px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
  }

  .modal-close {
    position: absolute;
    top: 1rem; right: 1rem;
    background: none;
    color: #4a5568;
    border: none;
    padding: 0.25rem;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
    z-index: 1;
  }

  .modal-close:hover {
    color: #2c3e50;
  }

  .modal-close:focus {
    outline: 2px solid rgba(102, 126, 234, 0.6);
    outline-offset: 2px;
  }

  .modal-image-container {
    width: 100%;
    height: 400px;
    overflow: hidden;
    background-color: #e9ecef;
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
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.3;
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .modal-website {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: #7f8c8d;
    font-style: italic;
  }

  .modal-description {
    margin: 0 0 2rem 0;
    font-size: 1.125rem;
    color: #4a5568;
    line-height: 1.6;
  }

  .modal-description-detailed {
    margin: 0 0 2rem 0;
  }

  .modal-paragraph {
    margin: 0 0 1.25rem 0;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.7;
    text-align: justify;
  }

  .modal-paragraph:last-child {
    margin-bottom: 0;
  }

  .modal-features {
    margin-bottom: 2rem;
  }

  .modal-features-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
  }

  .modal-feature-list {
    margin: 0;
    padding-left: 1.5rem;
    list-style-type: disc;
  }

  .modal-feature-item {
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: #4a5568;
    line-height: 1.6;
  }

  .modal-feature-item:last-child {
    margin-bottom: 0;
  }

  .modal-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .modal-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: var(--gradient-accent);
    color: #ffffff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .modal-link:hover {
    background: var(--gradient-accent-hover);
    transform: translateX(4px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .modal-link:focus {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  /* Mobile styles (< 768px) - 1 column */
  @media (max-width: 767px) {
    .products {
      padding: 2.5rem 0;
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
      gap: 1.5rem;
    }

    .product-image-container {
      height: 150px;
    }

    .product-content {
      padding: 1.5rem;
    }

    .product-name {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .product-website {
      font-size: 0.8125rem;
      margin-bottom: 0.875rem;
    }

    .product-description {
      font-size: 0.9375rem;
      margin-bottom: 1.25rem;
    }

    .product-links {
      gap: 0.75rem;
    }

    .product-link {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
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

    .modal-website {
      font-size: 0.875rem;
    }

    .modal-description {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .modal-paragraph {
      font-size: 0.9375rem;
      margin-bottom: 1rem;
    }

    .modal-features {
      margin-bottom: 1.5rem;
    }

    .modal-features-title {
      font-size: 1.125rem;
    }

    .modal-feature-item {
      font-size: 0.9375rem;
      margin-bottom: 0.625rem;
    }

    .modal-link {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
    }
  }

  /* Tablet styles (768px - 1024px) - 2 columns */
  @media (min-width: 768px) and (max-width: 1024px) {
    .products {
      padding: 3rem 0;
    }

    .products-container {
      padding: 0 1.5rem;
    }

    .products-title {
      font-size: 1.75rem;
      margin-bottom: 2.5rem;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.75rem;
    }

    .product-image-container {
      height: 180px;
    }

    .product-content {
      padding: 1.75rem;
    }

    .product-name {
      font-size: 1.375rem;
      margin-bottom: 0.5rem;
    }

    .product-website {
      font-size: 0.85rem;
      margin-bottom: 0.9375rem;
    }

    .product-description {
      font-size: 0.96875rem;
      margin-bottom: 1.375rem;
    }

    .product-links {
      gap: 0.875rem;
    }

    .product-link {
      padding: 0.6875rem 1.375rem;
      font-size: 0.90625rem;
    }

    .modal-image-container {
      height: 350px;
    }
  }

  /* Desktop styles (> 1024px) - 2 columns */
  @media (min-width: 1025px) {
    .products {
      padding: 4rem 0;
    }

    .products-container {
      padding: 0 2rem;
    }

    .products-title {
      font-size: 2rem;
      margin-bottom: 3rem;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .product-image-container {
      height: 200px;
    }

    .product-content {
      padding: 2rem;
    }

    .product-name {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .product-website {
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .product-description {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .product-links {
      gap: 1rem;
    }

    .product-link {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
    }

    .modal-image-container {
      height: 400px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .products {
      background: var(--gradient-section-light);
    }

    .products-title {
      color: #ffffff;
    }

    .product-card {
      background: var(--glass-bg);
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
    }

    .product-card:hover {
      box-shadow: var(--glass-shadow-hover);
      background: var(--glass-bg-medium);
    }

    .product-image-container {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .product-name {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .product-website {
      color: rgba(255, 255, 255, 0.5);
    }

    .product-description {
      color: rgba(255, 255, 255, 0.7);
    }

    .product-link {
      background: var(--gradient-accent);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .product-link:hover {
      background: var(--gradient-accent-hover);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .modal-overlay {
      background: rgba(5, 5, 15, 0.7);
    }

    .modal-content {
      background: rgba(20, 20, 35, 0.95);
      border: var(--glass-border-strong);
      box-shadow: var(--glass-shadow-elevated);
    }

    .modal-close {
      color: rgba(255, 255, 255, 0.6);
    }

    .modal-close:hover {
      color: #ffffff;
    }

    .modal-image-container {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .modal-title {
      background: linear-gradient(135deg, #93b5f5 0%, #c4a0e8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .modal-website {
      color: rgba(255, 255, 255, 0.5);
    }

    .modal-description {
      color: rgba(255, 255, 255, 0.7);
    }

    .modal-paragraph {
      color: rgba(255, 255, 255, 0.7);
    }

    .modal-features-title {
      color: #ffffff;
    }

    .modal-feature-item {
      color: rgba(255, 255, 255, 0.7);
    }

    .modal-link {
      background: var(--gradient-accent);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .modal-link:hover {
      background: var(--gradient-accent-hover);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .products {
      background-color: #ffffff;
    }

    .products-title {
      color: #000000;
      font-weight: 800;
    }

    .product-card {
      background-color: #ffffff;
      border: 2px solid #000000;
      box-shadow: none;
    }

    .product-name {
      color: #000000;
      font-weight: 700;
    }

    .product-website {
      color: #000000;
      font-weight: 600;
    }

    .product-description {
      color: #000000;
      font-weight: 600;
    }

    .product-link {
      background-color: #000000;
      color: #ffffff;
      border: 2px solid #000000;
    }

    .product-link:hover {
      background-color: #ffffff;
      color: #000000;
    }

    .modal-content {
      background-color: #ffffff;
      border: 3px solid #000000;
    }

    .modal-title {
      color: #000000;
      font-weight: 700;
    }

    .modal-website {
      color: #000000;
      font-weight: 600;
    }

    .modal-description {
      color: #000000;
      font-weight: 600;
    }

    .modal-paragraph {
      color: #000000;
      font-weight: 600;
    }

    .modal-features-title {
      color: #000000;
      font-weight: 700;
    }

    .modal-feature-item {
      color: #000000;
      font-weight: 600;
    }

    .modal-link {
      background-color: #000000;
      color: #ffffff;
      border: 2px solid #000000;
    }

    .modal-link:hover {
      background-color: #ffffff;
      color: #000000;
    }
  }

  /* Print styles */
  @media print {
    .products {
      background-color: #ffffff;
      padding: 1rem 0;
      page-break-inside: avoid;
    }

    .products-title {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .product-card {
      background-color: #ffffff;
      border: 1px solid #000000;
      box-shadow: none;
      page-break-inside: avoid;
      cursor: default;
    }

    .product-card:hover {
      transform: none;
      box-shadow: none;
    }

    .product-image-container {
      height: 150px;
    }

    .product-content {
      padding: 1rem;
    }

    .product-name {
      color: #000000;
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .product-website {
      color: #000000;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .product-description {
      color: #000000;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .product-links {
      gap: 0.5rem;
    }

    .product-link {
      display: inline-block;
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .product-link:hover {
      transform: none;
    }

    .modal-overlay {
      display: none;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .product-card {
      transition: none;
    }

    .product-card:hover {
      transform: none;
    }

    .product-image {
      transition: none;
    }

    .product-card:hover .product-image {
      transform: none;
    }

    .product-link {
      transition: none;
    }

    .product-link:hover {
      transform: none;
    }

    .modal-link {
      transition: none;
    }

    .modal-link:hover {
      transform: none;
    }
  }
</style>
