<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import certNvidia from '../assets/images/cerificates/nvidia.png';
  import cert1 from '../assets/images/cerificates/1.png';
  import cert2 from '../assets/images/cerificates/2.png';
  import cert3 from '../assets/images/cerificates/3.png';
  import cert4 from '../assets/images/cerificates/4.png';

  const sectionTitle = $derived(t('certificates.title', $languageStore));
  const sectionSubtitle = $derived(t('certificates.subtitle', $languageStore));
  const prevLabel = $derived(t('certificates.prev', $languageStore));
  const nextLabel = $derived(t('certificates.next', $languageStore));

  const certificates = [
    { src: certNvidia, alt: 'NVIDIA Certificate of Competency — Getting Started with Deep Learning, Mikhail Peraviortkin, NVIDIA, 2026' },
    { src: cert1, alt: 'Oracle Application Development Framework 11g Certified Implementation Specialist — Mikhail Peraviortkin, Oracle University, 2014' },
    { src: cert2, alt: 'Hugging Face Agents Course — Fundamentals of Agents certificate, Mikhail Peraviortkin, 2025' },
    { src: cert3, alt: 'Hugging Face LLM Course — Fundamentals of LLMs certificate, Mikhail Peraviortkin, 2025' },
    { src: cert4, alt: 'Hugging Face MCP Course — Fundamentals of MCP certificate, Mikhail Peraviortkin, 2025' }
  ];

  let sliderOffset = $state(0);
  let visibleCount = $state(3);
  let lightboxIndex = $state<number | null>(null);

  function getVisibleCount(): number {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1025) return 2;
    return 3;
  }

  function handleResize() {
    visibleCount = getVisibleCount();
    const maxOffset = Math.max(0, certificates.length - visibleCount);
    if (sliderOffset > maxOffset) sliderOffset = maxOffset;
  }

  const maxOffset = $derived(Math.max(0, certificates.length - visibleCount));
  const canPrev = $derived(sliderOffset > 0);
  const canNext = $derived(sliderOffset < maxOffset);
  const sliderTransform = $derived(`translateX(calc(-${sliderOffset} * (100% + 2rem) / ${visibleCount}))`);

  function slidePrev() {
    if (canPrev) sliderOffset--;
  }

  function slideNext() {
    if (canNext) sliderOffset++;
  }

  function slideTo(index: number) {
    sliderOffset = Math.min(index, maxOffset);
  }

  function openLightbox(index: number) {
    lightboxIndex = index;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxIndex = null;
    document.body.style.overflow = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (lightboxIndex === null) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft' && lightboxIndex > 0) lightboxIndex--;
    if (event.key === 'ArrowRight' && lightboxIndex < certificates.length - 1) lightboxIndex++;
  }

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

  onMount(() => {
    visibleCount = getVisibleCount();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<section class="certificates scroll-reveal" aria-labelledby="certificates-title">
  <div class="certificates-container">
    <div class="certificates-header">
      <div class="certificates-header-accent"></div>
      <h2 id="certificates-title" class="certificates-title">{sectionTitle}</h2>
      {#if sectionSubtitle && sectionSubtitle !== 'certificates.subtitle'}
        <p class="certificates-subtitle">{sectionSubtitle}</p>
      {/if}
    </div>

    <div class="slider-wrapper">
      <button
        type="button"
        class="slider-arrow slider-arrow-prev"
        onclick={slidePrev}
        disabled={!canPrev}
        aria-label={prevLabel}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <div
        class="slider-viewport"
        ontouchstart={handleTouchStart}
        ontouchend={handleTouchEnd}
      >
        <div class="certificates-grid" style="transform: {sliderTransform};">
          {#each certificates as cert, index}
            <button
              type="button"
              class="certificate-card"
              onclick={() => openLightbox(index)}
              aria-label="Open certificate {index + 1}"
            >
              <img src={cert.src} alt={cert.alt} class="certificate-image" loading="lazy" />
            </button>
          {/each}
        </div>
      </div>

      <button
        type="button"
        class="slider-arrow slider-arrow-next"
        onclick={slideNext}
        disabled={!canNext}
        aria-label={nextLabel}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>

    {#if maxOffset > 0}
      <div class="slider-dots" role="tablist" aria-label="Certificate slides">
        {#each Array(maxOffset + 1) as _, i}
          <button
            type="button"
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
  </div>
</section>

{#if lightboxIndex !== null}
  <div
    class="lightbox-overlay"
    onclick={closeLightbox}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeLightbox(); }}
    role="dialog"
    aria-modal="true"
    aria-label="Certificate preview"
    tabindex="-1"
  >
    <button type="button" class="lightbox-close" onclick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label="Close">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
    </button>
    <img
      src={certificates[lightboxIndex].src}
      alt={certificates[lightboxIndex].alt}
      class="lightbox-image"
      onclick={(e) => e.stopPropagation()}
    />
  </div>
{/if}

<style>
  .certificates {
    padding: 5rem 2rem;
    background: var(--color-background, #ffffff);
  }

  .certificates-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .certificates-header {
    text-align: center;
    margin-bottom: 3rem;
    position: relative;
  }

  .certificates-header-accent {
    width: 60px;
    height: 4px;
    background: var(--color-primary, #0ea5e9);
    border-radius: 2px;
    margin: 0 auto 1.25rem;
  }

  .certificates-title {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 700;
    color: var(--color-text, #0f172a);
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  .certificates-subtitle {
    font-size: 1.05rem;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
  }

  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .slider-arrow {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: #ffffff;
    color: var(--color-text, #0f172a);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }

  .slider-arrow:hover:not(:disabled) {
    background: var(--color-primary, #0ea5e9);
    color: #ffffff;
    border-color: var(--color-primary, #0ea5e9);
    transform: scale(1.05);
  }

  .slider-arrow:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .slider-viewport {
    flex: 1 1 auto;
    overflow: hidden;
    touch-action: pan-y;
  }

  .certificates-grid {
    display: flex;
    gap: 2rem;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .certificate-card {
    flex: 0 0 calc((100% - 2 * 2rem) / 3);
    aspect-ratio: 4 / 3;
    border-radius: 12px;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid rgba(15, 23, 42, 0.08);
    padding: 0;
    cursor: zoom-in;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }

  .certificate-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  }

  .certificate-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #ffffff;
    display: block;
  }

  .slider-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  .slider-dot {
    width: 10px;
    height: 10px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: rgba(15, 23, 42, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .slider-dot:hover {
    background: rgba(15, 23, 42, 0.4);
  }

  .slider-dot.active {
    background: var(--color-primary, #0ea5e9);
    width: 28px;
    border-radius: 5px;
  }

  @media (max-width: 1024px) {
    .certificate-card {
      flex: 0 0 calc((100% - 2rem) / 2);
    }
  }

  @media (max-width: 767px) {
    .certificates {
      padding: 3.5rem 1rem;
    }
    .certificate-card {
      flex: 0 0 100%;
    }
    .slider-arrow {
      width: 38px;
      height: 38px;
    }
  }

  .lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.2s ease;
  }

  .lightbox-image {
    max-width: 95vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }

  .lightbox-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
