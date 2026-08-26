<script lang="ts">
  import { languageStore, type Language } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { track } from '../services/tracking';

  type TelegramBrand = {
    id: string;
    label: string;
    urls: Record<Language, string>;
  };

  const telegramBrands: TelegramBrand[] = [
    {
      id: 'aiBudgetAssistant',
      label: 'AI Budget Assistant',
      urls: {
        ru: 'https://t.me/aibudgetassistantBy',
        en: 'https://t.me/aibudgetassistantEn',
        pl: 'https://t.me/aibudgetassistant'
      }
    },
    {
      id: 'eKsiegowyAI',
      label: 'eKsiegowyAI',
      urls: {
        ru: 'https://t.me/eKsiegowyAIby',
        en: 'https://t.me/eKsiegowyAIEn',
        pl: 'https://t.me/eKsiegowyAI'
      }
    },
    {
      id: 'micode',
      label: 'MiCode',
      urls: {
        ru: 'https://t.me/micode_by',
        en: 'https://t.me/micode_en',
        pl: 'https://t.me/micode_ai'
      }
    }
  ];

  const facebookUrl = 'https://www.facebook.com/profile.php?id=61570771625318';
  const instagramUrl = 'https://www.instagram.com/micode.development/';

  // These links leave the site, so the click is the last thing we can observe
  // about that visitor. Same event shape as the product-page outbound links
  // (see ProductPage.svelte) so both can be compared in one GA4 report.
  function trackSocial(network: string, itemId: string) {
    track('click', { outbound: true, link_type: network, item_id: itemId });
  }

  const heading = $derived(t('footer.socialMedia', $languageStore));
  const telegramLinks = $derived(telegramBrands.map(brand => ({
    id: brand.id,
    label: brand.label,
    url: brand.urls[$languageStore]
  })));
</script>

<div class="social-media" aria-label={heading}>
  <p class="social-heading">{heading}</p>

  <ul class="social-list">
    {#each telegramLinks as link (link.id)}
      <li>
        <a
          class="social-icon-btn"
          href={link.url}
          onclick={() => trackSocial('telegram', link.id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram — {link.label}"
          title={link.label}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          <span class="brand-label">{link.label}</span>
        </a>
      </li>
    {/each}
    <li>
      <a
        class="social-icon-btn icon-only"
        href={facebookUrl}
        onclick={() => trackSocial('facebook', 'facebook')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        title="Facebook"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
    </li>
    <li>
      <a
        class="social-icon-btn icon-only"
        href={instagramUrl}
        onclick={() => trackSocial('instagram', 'instagram')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Instagram"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
      </a>
    </li>
  </ul>
</div>

<style>
  .social-media {
    flex-shrink: 0;
    text-align: right;
  }

  .social-heading {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  .social-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 0.4rem;
  }

  .social-icon-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.625rem;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
  }

  .social-icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.3);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .social-icon-btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }

  .social-icon-btn svg {
    flex-shrink: 0;
  }

  .icon-only {
    padding: 0.4rem;
    width: 32px;
    height: 32px;
    justify-content: center;
  }

  @media (max-width: 900px) {
    .social-media {
      text-align: center;
    }

    .social-list {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .brand-label {
      display: none;
    }

    .social-icon-btn {
      padding: 0.4rem;
      width: 32px;
      height: 32px;
      justify-content: center;
    }
  }

  @media (prefers-contrast: high) {
    .social-heading {
      color: #ffffff;
    }

    .social-icon-btn {
      background: transparent;
      border-color: #ffffff;
      color: #ffffff;
    }
  }

  @media print {
    .social-media {
      display: none;
    }
  }
</style>
