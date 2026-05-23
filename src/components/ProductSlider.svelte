<script lang="ts">
  import type { Product } from '../types/products';
  import ProductCard from './ProductCard.svelte';

  interface Props {
    products: Product[];
    productImages: Record<string, string>;
    onProductSelect: (product: Product) => void;
  }

  const { products, productImages, onProductSelect }: Props = $props();

  let sliderOffset = $state(0);

  function getVisibleCount(): number {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1025) return 2;
    return 3;
  }

  let visibleCount = $state(getVisibleCount());

  function handleResize() {
    visibleCount = getVisibleCount();
    const maxOff = Math.max(0, products.length - visibleCount);
    if (sliderOffset > maxOff) sliderOffset = maxOff;
  }

  const maxOffset = $derived(Math.max(0, products.length - visibleCount));
  const canPrev = $derived(sliderOffset > 0);
  const canNext = $derived(sliderOffset < maxOffset);

  // Step shift = (100% + gap) / visibleCount; gap matches --grid-gap CSS variable
  const sliderTransform = $derived(
    `translateX(calc(-${sliderOffset} * (100% + var(--grid-gap)) / ${visibleCount}))`
  );

  function slidePrev() { if (canPrev) sliderOffset--; }
  function slideNext() { if (canNext) sliderOffset++; }
  function slideTo(index: number) { sliderOffset = Math.min(index, maxOffset); }

  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) slideNext();
    else slidePrev();
  }
</script>

<svelte:window onresize={handleResize} />

<div class="slider-wrapper">
  {#if maxOffset > 0}
    <button
      class="slider-arrow slider-arrow-prev"
      onclick={slidePrev}
      disabled={!canPrev}
      aria-label="Previous products"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
  {/if}

  <div
    class="slider-viewport"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
  >
    <div
      class="products-grid"
      style="--visible-count: {visibleCount}; transform: {sliderTransform};"
    >
      {#each products as product, index (product.id)}
        <div class="slide-item">
          <ProductCard
            {product}
            productImage={productImages[product.id]}
            {index}
            onOpenModal={onProductSelect}
          />
        </div>
      {/each}
    </div>
  </div>

  {#if maxOffset > 0}
    <button
      class="slider-arrow slider-arrow-next"
      onclick={slideNext}
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
        onclick={() => slideTo(i)}
        role="tab"
        aria-selected={sliderOffset === i}
        aria-label="Go to slide {i + 1}"
      ></button>
    {/each}
  </div>
{/if}

<style>
  /* ===== Slider ===== */
  .slider-wrapper {
    position: relative;
  }

  .slider-viewport {
    overflow: hidden;
    width: 100%;
    touch-action: pan-y;
  }

  .products-grid {
    display: flex;
    --grid-gap: 2rem;
    gap: var(--grid-gap);
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .slide-item {
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

  /* ===== Responsive — Mobile ===== */
  @media (max-width: 767px) {
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
  }

  /* ===== Responsive — Tablet ===== */
  @media (min-width: 768px) and (max-width: 1024px) {
    .products-grid {
      --grid-gap: 1.5rem;
    }
  }

  /* ===== Dark Mode ===== */
  @media (prefers-color-scheme: dark) {
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

  /* ===== Print ===== */
  @media print {
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

    .slide-item {
      min-width: 100%;
      max-width: 100%;
    }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .products-grid {
      transition: none;
    }

    .slider-dot:hover {
      transform: none;
    }
  }
</style>
