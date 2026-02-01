<script lang="ts">
  /**
   * OptimizedImage component using <picture> element with WebP sources and fallback formats
   * Provides optimal image format based on browser support
   * 
   * Accessibility: The alt prop is required to ensure all images have descriptive alternative text.
   * - For content images: Provide descriptive alt text that conveys the meaning/purpose
   * - For decorative images: Use empty string alt="" to indicate the image is decorative
   */
  export let src: string; // Base path without extension (e.g., '/images/founder')
  export let alt: string; // Required: Descriptive text for screen readers
  export let width: string | undefined = undefined;
  export let height: string | undefined = undefined;
  export let className: string = '';
  export let loading: 'lazy' | 'eager' = 'lazy';
  export let fallbackFormat: 'jpg' | 'png' = 'jpg'; // Fallback format for browsers that don't support WebP
  
  // Generate source paths
  const webpSrc = `${src}.webp`;
  const fallbackSrc = `${src}.${fallbackFormat}`;
</script>

<picture class={className}>
  <!-- WebP source for modern browsers -->
  <source srcset={webpSrc} type="image/webp" />
  
  <!-- Fallback for browsers that don't support WebP -->
  <source srcset={fallbackSrc} type={fallbackFormat === 'jpg' ? 'image/jpeg' : 'image/png'} />
  
  <!-- Fallback img element -->
  <img 
    src={fallbackSrc}
    {alt}
    {width}
    {height}
    loading={loading}
    decoding="async"
  />
</picture>

<style>
  picture {
    display: inline-block;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
</style>
