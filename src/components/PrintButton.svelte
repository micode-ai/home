<script lang="ts">
  import { t } from '../services/i18n';
  import { track } from '../services/tracking';

  let { lang }: { lang: string } = $props();

  function handlePrint() {
    track('share', { method: 'print', content_type: 'article' });
    window.print();
  }
</script>

<button type="button" class="print-btn" data-testid="print-button" onclick={handlePrint}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
  {t('blog.share.print', lang)}
</button>

<style>
  .print-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 40px;
    padding: 0.5rem 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .print-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  @media (prefers-reduced-motion: reduce) {
    .print-btn {
      transition: none;
    }
  }
</style>
