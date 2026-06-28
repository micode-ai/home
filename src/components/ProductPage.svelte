<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import productsData from '../data/products.json';
  import { langGraphSchemas } from '../data/langGraphSchemas';
  import type { Product } from '../types/products';
  import CommunityStatBadges from './CommunityStatBadges.svelte';
  import LangGraphSchema from './LangGraphSchema.svelte';
  import ngxChatImage from '../assets/images/ngx-open-web-ui-chat.png';
  import accountingAiImage from '../assets/images/accounting-ai.png';
  import budgetAssistantImage from '../assets/images/budget-assistant.jpg';
  import emarketingAiImage from '../assets/images/emarketing-ai.png';
  import testingAiImage from '../assets/images/testing-ai.png';

  const productImages: Record<string, string> = {
    'ngx-chat': ngxChatImage,
    'accounting-ai': accountingAiImage,
    'emarketing-ai': emarketingAiImage,
    'budget-assistant': budgetAssistantImage,
    'testing-ai': testingAiImage,
  };

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

  const lang = $derived($languageStore);
  const aboutLabel = $derived(t('product.about', lang));
  const featuresLabel = $derived(t('product.features', lang));
  const architectureLabel = $derived(t('product.architecture', lang));
  const architectureNote = $derived(t('product.architectureNote', lang));
  const linksLabel = $derived(t('product.links', lang));
  const backLabel = $derived(t('product.backToMicode', lang));
  const notFoundLabel = $derived(t('product.notFound', lang));

  const schema = $derived(langGraphSchemas[productId]);

  const productImage = $derived(productImages[productId]);
</script>

{#if product}
<article
  class="product-page"
  aria-labelledby="product-name"
  style="--card-accent: {product.accentColor ?? 'var(--color-primary)'}"
>
  <div class="page-accent-bar" aria-hidden="true"></div>

  <!-- ===== Hero — two-column: text left, image right ===== -->
  <div class="product-hero">
    <div class="product-hero-inner" class:has-image={!!productImage}>

      <!-- Left: all text content -->
      <div class="product-hero-text">
        {#if product.badge}
          <span class="product-badge">
            {#if product.badge.icon === 'code'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            {:else if product.badge.icon === 'cloud'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
            {:else if product.badge.icon === 'smartphone'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            {/if}
            {product.badge.label}
          </span>
        {/if}

        <h1 id="product-name" class="product-name">{name}</h1>
        <p class="product-description">{description}</p>

        <div class="product-meta">
          {#if product.website}
            <a
              href={product.website}
              class="product-website-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {product.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            </a>
          {/if}
          <CommunityStatBadges stats={product.communityStats} size="md" />
        </div>

        {#if product.pricingKey}
          <div class="product-pricing">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></svg>
            {t(product.pricingKey, lang)}
          </div>
        {/if}

        {#if product.links && product.links.length > 0}
          <div class="hero-links">
            {#each product.links as link}
              <a
                href={link.url}
                class="hero-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{t(link.labelKey, lang)} — {name}"
              >
                {#if link.type === 'npm'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
                {:else if link.type === 'github'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {:else if link.type === 'playStore'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                {:else if link.type === 'demo'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h20v14H2z"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {/if}
                {t(link.labelKey, lang)}
                <svg class="link-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right: product image -->
      {#if productImage}
        <div class="product-hero-image-col">
          <img src={productImage} alt={name} class="product-hero-image" loading="eager" />
        </div>
      {/if}

    </div>
  </div>

  <!-- ===== Content ===== -->
  <div class="product-content">
    <div class="product-content-inner">

      <section class="content-section" aria-labelledby="section-about">
        <h2 id="section-about" class="section-heading">{aboutLabel}</h2>
        {#if detailedDescription}
          {#each detailedDescription.split('\n\n') as paragraph}
            <p class="section-paragraph">{paragraph}</p>
          {/each}
        {/if}
      </section>

      {#if features.length > 0}
        <section class="content-section" aria-labelledby="section-features">
          <h2 id="section-features" class="section-heading">{featuresLabel}</h2>
          <ul class="features-list" aria-label={featuresLabel}>
            {#each features as feature}
              <li class="feature-item">{feature}</li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if schema}
        <section class="content-section" aria-labelledby="section-architecture">
          <h2 id="section-architecture" class="section-heading">{architectureLabel}</h2>
          <p class="section-paragraph">{architectureNote}</p>
          <LangGraphSchema definition={schema} label="{architectureLabel} — {name}" />
        </section>
      {/if}

      {#if product.links && product.links.length > 0}
        <section class="content-section content-links-section" aria-labelledby="section-links">
          <h2 id="section-links" class="section-heading">{linksLabel}</h2>
          <div class="content-links">
            {#each product.links as link}
              <a
                href={link.url}
                class="content-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="{t(link.labelKey, lang)} — {name}"
              >
                {#if link.type === 'npm'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
                {:else if link.type === 'github'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {:else if link.type === 'playStore'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                {:else if link.type === 'demo'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h20v14H2z"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {/if}
                {t(link.labelKey, lang)}
                <svg class="link-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <div class="back-link">
        <a href="/">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          {backLabel}
        </a>
      </div>
    </div>
  </div>
</article>
{:else}
<p class="not-found">{notFoundLabel}</p>
{/if}

<style>
  /* ===== Accent bar ===== */
  .page-accent-bar {
    height: 4px;
    background: var(--card-accent, var(--color-primary));
    width: 100%;
  }

  /* ===== Hero ===== */
  .product-hero {
    background: var(--color-bg-hero, #0f172a);
    color: #fff;
    padding: 3.5rem 2rem 3.5rem;
  }

  /* Single-column by default; two-column when image present */
  .product-hero-inner {
    max-width: 960px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    align-items: center;
  }

  .product-hero-inner.has-image {
    grid-template-columns: 1fr 260px;
  }

  /* ===== Hero text column ===== */
  .product-hero-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* ===== Badge — compact pill ===== */
  .product-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.55rem;
    background: rgba(255, 255, 255, 0.1);
    color: var(--card-accent, var(--color-primary));
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: var(--radius-full);
    border: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 1rem;
  }

  /* ===== Title & description ===== */
  .product-name {
    font-family: var(--font-heading);
    font-size: clamp(1.625rem, 3.5vw, 2.5rem);
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0.875rem;
    color: #fff;
  }

  .product-description {
    font-size: 1.0625rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.72);
    margin: 0 0 1.5rem;
  }

  /* ===== Meta row: website + stats ===== */
  .product-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.875rem;
  }

  .product-website-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--card-accent, var(--color-primary));
    text-decoration: none;
    transition: opacity var(--transition-fast);
    white-space: nowrap;
  }

  .product-website-link:hover { opacity: 0.75; }

  .product-website-link:focus-visible {
    outline: 2px solid var(--card-accent, var(--color-primary));
    outline-offset: 3px;
    border-radius: 3px;
  }

  /* ===== Pricing pill ===== */
  .product-pricing {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 1.5rem;
    padding: 0.3125rem 0.625rem;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.75);
  }

  .product-pricing svg {
    color: var(--card-accent, var(--color-primary));
    flex-shrink: 0;
  }

  /* ===== Hero CTA buttons — medium size ===== */
  .hero-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .hero-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--card-accent, var(--color-primary));
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    transition: opacity var(--transition-base), transform var(--transition-base);
    cursor: pointer;
  }

  .hero-link:hover { opacity: 0.88; transform: translateY(-1px); }
  .hero-link:visited { color: #ffffff; }

  .hero-link:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 3px;
  }

  .hero-link .link-arrow { transition: transform var(--transition-base); }
  .hero-link:hover .link-arrow { transform: translateX(3px); }

  /* ===== Hero image column ===== */
  .product-hero-image-col {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-hero-image {
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    border-radius: var(--radius-xl);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3);
    display: block;
  }

  /* ===== Content ===== */
  .product-content {
    padding: 3.5rem 2rem;
    background: var(--color-bg-primary, #fff);
  }

  .product-content-inner {
    max-width: 800px;
    margin: 0 auto;
  }

  .content-section { margin-bottom: 2.75rem; }

  .section-heading {
    font-family: var(--font-heading);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-text-tertiary, #64748b);
    margin: 0 0 1rem;
  }

  .section-paragraph {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--color-text-secondary, #475569);
    margin: 0 0 1.125rem;
  }

  .section-paragraph:last-child { margin-bottom: 0; }

  /* ===== Features list ===== */
  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .feature-item {
    position: relative;
    padding-left: 1.25rem;
    font-size: 0.9375rem;
    color: var(--color-text-secondary, #475569);
    line-height: 1.6;
  }

  .feature-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.48em;
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 50%;
    background: var(--card-accent, var(--color-primary));
  }

  /* ===== Content links ===== */
  .content-links-section {
    padding-top: 2.5rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
  }

  .content-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .content-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--card-accent, var(--color-primary));
    color: #ffffff;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    transition: opacity var(--transition-base), transform var(--transition-base);
    cursor: pointer;
  }

  .content-link:hover { opacity: 0.88; transform: translateY(-1px); }
  .content-link:visited { color: #ffffff; }

  .content-link:focus-visible {
    outline: 2px solid var(--card-accent, var(--color-primary));
    outline-offset: 3px;
  }

  .content-link .link-arrow { transition: transform var(--transition-base); }
  .content-link:hover .link-arrow { transform: translateX(3px); }

  /* ===== Back link ===== */
  .back-link {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
  }

  .back-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-primary, #1e3a8a);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: color var(--transition-fast);
    cursor: pointer;
  }

  .back-link a:hover {
    color: var(--color-primary-dark, #1e3a8a);
    text-decoration: underline;
  }

  .back-link a:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
    border-radius: 3px;
  }

  /* ===== Not found ===== */
  .not-found {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  /* ===== Responsive — Tablet ===== */
  @media (min-width: 768px) and (max-width: 1024px) {
    .product-hero { padding: 3rem 1.5rem; }

    .product-hero-inner.has-image {
      grid-template-columns: 1fr 220px;
      gap: 2rem;
    }
  }

  /* ===== Responsive — Mobile ===== */
  @media (max-width: 767px) {
    .product-hero { padding: 2.5rem 1.25rem; }

    /* Stack image below text on mobile */
    .product-hero-inner.has-image {
      grid-template-columns: 1fr;
    }

    .product-hero-image-col {
      order: -1;
    }

    .product-hero-image {
      max-height: 260px;
    }

    .product-description { font-size: 1rem; }

    .product-content { padding: 2.5rem 1.25rem; }

    .content-section { margin-bottom: 2.25rem; }
  }

  /* ===== Dark Mode ===== */
  @media (prefers-color-scheme: dark) {
    .product-content { background: var(--color-bg-primary); }
    .content-links-section,
    .back-link { border-top-color: var(--color-border); }
  }

  :global(html.dark-mode-active) .product-content {
    background: var(--color-bg-primary);
  }
  :global(html.dark-mode-active) .content-links-section,
  :global(html.dark-mode-active) .back-link {
    border-top-color: var(--color-border);
  }

  /* ===== High Contrast ===== */
  @media (prefers-contrast: high) {
    .product-hero { background: #000; }
    .product-name { color: #fff; }
    .product-badge { border: 2px solid #fff; background: transparent; }
    .hero-link, .content-link { background: #000; color: #fff; border: 2px solid #fff; }
    .feature-item::before { background: #000; outline: 1px solid #fff; }
  }

  /* ===== Print ===== */
  @media print {
    .product-hero { background: #f8f8f8; color: #000; }
    .product-name { color: #000; }
    .product-description { color: #333; }
    .page-accent-bar { background: #000; height: 2px; }
    .hero-link, .content-link { background: #fff; color: #000; border: 1px solid #000; }
    .product-hero-inner.has-image { grid-template-columns: 1fr; }
    .product-hero-image-col { display: none; }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .hero-link, .content-link, .back-link a, .product-website-link { transition: none; }
    .hero-link:hover, .content-link:hover { transform: none; }
    .hero-link .link-arrow, .content-link .link-arrow { transition: none; }
    .hero-link:hover .link-arrow, .content-link:hover .link-arrow { transform: none; }
  }
</style>
