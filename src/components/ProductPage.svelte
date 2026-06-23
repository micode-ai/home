<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import type { Product } from '../types/products';

  let { productId }: { productId: string } = $props();

  const product = $derived(
    (productsData as Product[]).find((p) => p.id === productId)
  );

  const name = $derived(product ? t(product.nameKey, $languageStore) : '');
  const description = $derived(product ? t(product.descriptionKey, $languageStore) : '');
  const detailedDescription = $derived(
    product && product.detailedDescriptionKey ? t(product.detailedDescriptionKey, $languageStore) : ''
  );
  const features = $derived(
    product && product.features ? product.features.map((key) => t(key, $languageStore)) : []
  );

  function getProductUrl(product: Product): string | undefined {
    return product.website ?? product.links?.[0]?.url;
  }
</script>

{#if product}
<article class="product-page" aria-labelledby="product-name">
  <div class="product-hero">
    <div class="product-hero-inner">
      {#if product.badge}<span class="product-badge">{product.badge.label}</span>{/if}
      <h1 id="product-name" class="product-name">{name}</h1>
      <p class="product-description">{description}</p>
      {#if getProductUrl(product)}
        <a href={getProductUrl(product)} target="_blank" rel="noopener noreferrer" class="product-cta">
          Visit website →
        </a>
      {/if}
    </div>
  </div>

  <div class="product-content">
    <div class="product-content-inner">
      <section class="product-details">
        <h2>About this product</h2>
        <p class="product-detailed">{detailedDescription}</p>
      </section>

      {#if features.length > 0}
      <section class="product-features">
        <h2>Key features</h2>
        <ul class="features-list">
          {#each features as feature}
            <li>{feature}</li>
          {/each}
        </ul>
      </section>
      {/if}

      {#if product.links && product.links.length > 0}
      <section class="product-links">
        <h2>Links</h2>
        <div class="links-list">
          {#each product.links as link}
            <a href={link.url} target="_blank" rel="noopener noreferrer" class="product-link">
              {t(link.labelKey, $languageStore)}
            </a>
          {/each}
        </div>
      </section>
      {/if}

      <div class="back-link">
        <a href="/">← Back to MiCode</a>
      </div>
    </div>
  </div>
</article>
{:else}
<p>Product not found.</p>
{/if}

<style>
  .product-hero {
    background: var(--color-bg-hero, #0f172a);
    color: #fff;
    padding: 4rem 2rem;
  }
  .product-hero-inner {
    max-width: 800px;
    margin: 0 auto;
  }
  .product-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--color-accent, #f97316);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }
  .product-name {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem;
    line-height: 1.2;
  }
  .product-description {
    font-size: 1.125rem;
    opacity: 0.85;
    margin: 0 0 2rem;
    max-width: 560px;
  }
  .product-cta {
    display: inline-block;
    padding: 0.875rem 2rem;
    background: var(--color-accent, #f97316);
    color: #fff;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: opacity 0.2s;
  }
  .product-cta:hover { opacity: 0.9; }
  .product-content { padding: 3rem 2rem; }
  .product-content-inner { max-width: 800px; margin: 0 auto; }
  .product-details, .product-features, .product-links { margin-bottom: 3rem; }
  .product-detailed { line-height: 1.8; white-space: pre-line; }
  .features-list { padding-left: 1.5rem; }
  .features-list li { margin-bottom: 0.5rem; line-height: 1.6; }
  .links-list { display: flex; flex-wrap: wrap; gap: 1rem; }
  .product-link {
    display: inline-block;
    padding: 0.625rem 1.25rem;
    border: 2px solid var(--color-primary, #1e3a8a);
    color: var(--color-primary, #1e3a8a);
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: background 0.2s, color 0.2s;
  }
  .product-link:hover {
    background: var(--color-primary, #1e3a8a);
    color: #fff;
  }
  .back-link { margin-top: 2rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
