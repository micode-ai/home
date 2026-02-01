<script lang="ts">
  /**
   * LazyImage component with loading="lazy" attribute for performance optimization
   * Images below the fold will be lazy-loaded automatically by the browser
   * 
   * Accessibility: The alt prop is required to ensure all images have descriptive alternative text.
   * - For content images: Provide descriptive alt text that conveys the meaning/purpose
   * - For decorative images: Use empty string alt="" to indicate the image is decorative
   */
  export let src: string;
  export let alt: string; // Required: Descriptive text for screen readers
  export let width: string | undefined = undefined;
  export let height: string | undefined = undefined;
  export let className: string = '';
  export let loading: 'lazy' | 'eager' = 'lazy';
</script>

<img 
  {src} 
  {alt} 
  {width}
  {height}
  loading={loading}
  class={className}
  decoding="async"
/>

<style>
  img {
    max-width: 100%;
    height: auto;
  }
</style>
