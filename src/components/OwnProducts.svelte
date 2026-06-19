<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import communityStatsData from '../data/community-stats.json';
  import type { Product } from '../types/products';
  import ProductSlider from './ProductSlider.svelte';
  import ProductModal from './ProductModal.svelte';
  import ngxChatImage from '../assets/images/ngx-open-web-ui-chat.png';
  import accountingAiImage from '../assets/images/accounting-ai.png';
  import budgetAssistantImage from '../assets/images/budget-assistant.jpg';
  import emarketingAiImage from '../assets/images/emarketing-ai.png';
  import testingAiImage from '../assets/images/testing-ai.png';

  const products: Product[] = (productsData as Product[]).map((p) => ({
    ...p,
    communityStats: (communityStatsData.stats as Record<string, { githubStars: number | null; npmWeeklyDownloads: number | null }>)[p.id] ?? null,
  }));

  const productImages: Record<string, string> = {
    'ngx-chat': ngxChatImage,
    'accounting-ai': accountingAiImage,
    'emarketing-ai': emarketingAiImage,
    'budget-assistant': budgetAssistantImage,
    'testing-ai': testingAiImage
  };

  let selectedProduct = $state<Product | null>(null);

  const sectionTitle = $derived(t('products.title', $languageStore));

  function openModal(product: Product) {
    selectedProduct = product;
  }

  function closeModal() {
    selectedProduct = null;
  }
</script>

<section class="products scroll-reveal" id="products" aria-labelledby="products-title">
  <div class="products-container">
    <div class="products-header">
      <div class="products-header-accent"></div>
      <h2 id="products-title" class="products-title">{sectionTitle}</h2>
      <p class="products-subtitle">{t('products.subtitle', $languageStore)}</p>
    </div>

    <ProductSlider {products} {productImages} onProductSelect={openModal} />
  </div>
</section>

{#if selectedProduct}
  <ProductModal
    product={selectedProduct}
    productImage={productImages[selectedProduct.id]}
    onClose={closeModal}
  />
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
  }

  /* ===== Print ===== */
  @media print {
    .products {
      background: #ffffff;
      padding: 1rem 0;
    }
  }
</style>
