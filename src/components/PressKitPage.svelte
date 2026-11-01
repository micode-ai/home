<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import CompanyInfo from './CompanyInfo.svelte';
  import CopyButton from './CopyButton.svelte';
  import pressKit from '../data/press-kit.json';

  const lang = $derived($languageStore);
  const boilerplateLangs = ['pl', 'en', 'ru'] as const;
  const sizes = ['short', 'long'] as const;
  const langNames: Record<string, string> = { pl: 'Polski', en: 'English', ru: 'Русский' };

  const companyName = $derived(t('header.companyName', lang));
  const backLabel = $derived(t('blog.backToMicode', lang));
  const tr = (key: string) => t(`press.${key}`, lang);
  const copied = $derived(tr('copied'));
  const copyFailed = $derived(tr('copyFailed'));
</script>

<article class="press-page" aria-labelledby="press-title">
  <div class="press-hero">
    <div class="press-inner">
      <nav class="press-breadcrumb" aria-label="Breadcrumb">
        <a href={withLocale('/', lang)}>{companyName}</a>
      </nav>
      <h1 id="press-title" class="press-title">{tr('title')}</h1>
      <p class="press-intro">{tr('intro')}</p>
      <a class="press-btn" href={pressKit.zipPath} download>{tr('zipDownload')}</a>
    </div>
  </div>

  <CompanyInfo />

  <div class="press-body">
    <div class="press-inner">
      <section class="press-section" aria-labelledby="press-logos">
        <h2 id="press-logos">{tr('logosTitle')}</h2>
        <div class="logo-grid">
          {#each ['dark', 'light'] as variant}
            {@const label = tr(variant === 'dark' ? 'logoDark' : 'logoLight')}
            <figure class="logo-card">
              <div class="logo-preview" class:on-dark={variant === 'light'}>
                <img
                  src={`/press/logos/micode-logo-${variant}.svg`}
                  alt={`MiCode — ${label}`}
                  width="280"
                  height="88"
                  loading="lazy"
                />
              </div>
              <figcaption>
                <span>{label}</span>
                <span class="logo-links">
                  <a href={`/press/logos/micode-logo-${variant}.svg`} download>{tr('downloadSvg')}</a>
                  <a href={`/press/logos/micode-logo-${variant}.png`} download>{tr('downloadPng')}</a>
                </span>
              </figcaption>
            </figure>
          {/each}
        </div>
        <h3>{tr('usageTitle')}</h3>
        <ul class="usage">
          <li>{tr('usage1')}</li>
          <li>{tr('usage2')}</li>
          <li>{tr('usage3')}</li>
          <li>{tr('usage4')}</li>
        </ul>
      </section>

      <section class="press-section" aria-labelledby="press-colors">
        <h2 id="press-colors">{tr('colorsTitle')}</h2>
        <ul class="swatches">
          {#each pressKit.colors as color}
            <li class="swatch">
              <span class="chip" style={`background:${color.hex}`} aria-hidden="true"></span>
              <span class="swatch-name">{t(color.nameKey, lang)}</span>
              <code>{color.hex}</code>
              <CopyButton value={color.hex} label={`${tr('copyHex')} ${color.hex}`} copiedLabel={copied} failedLabel={copyFailed} />
            </li>
          {/each}
        </ul>
      </section>

      <section class="press-section" aria-labelledby="press-boilerplate">
        <h2 id="press-boilerplate">{tr('boilerplateTitle')}</h2>
        {#each boilerplateLangs as bl}
          <div class="bp-lang" lang={bl}>
            <h3>{langNames[bl]}</h3>
            {#each sizes as size}
              {@const text = pressKit.boilerplate[bl][size]}
              {@const sizeLabel = tr(size === 'short' ? 'words50' : 'words150')}
              <div class="bp-card">
                <div class="bp-head">
                  <strong>{sizeLabel}</strong>
                  <CopyButton
                    value={text}
                    label={`${tr('copyText')} (${langNames[bl]}, ${sizeLabel})`}
                    copiedLabel={copied}
                    failedLabel={copyFailed}
                  />
                </div>
                <p>{text}</p>
              </div>
            {/each}
          </div>
        {/each}
      </section>

      <section class="press-section" aria-labelledby="press-shots">
        <h2 id="press-shots">{tr('screenshotsTitle')}</h2>
        <ul class="shots">
          {#each pressKit.screenshots as shot}
            <li>
              <a href={`/press/screenshots/${shot.src}`} download>
                <img src={`/press/screenshots/${shot.src}`} alt={shot.id} loading="lazy" />
                <span>{shot.id}</span>
              </a>
            </li>
          {/each}
        </ul>
        <p class="zip-note">{tr('zipText')} <a href={pressKit.zipPath} download>{tr('zipDownload')}</a></p>
      </section>

      <section class="press-section" aria-labelledby="press-contact">
        <h2 id="press-contact">{tr('contactTitle')}</h2>
        <p>{tr('contactText')} <a href={`mailto:${pressKit.contactEmail}`}>{pressKit.contactEmail}</a></p>
      </section>

      <div class="back-link"><a href={withLocale('/', lang)}>{backLabel}</a></div>
    </div>
  </div>
</article>

<style>
  .press-hero { background: var(--color-bg-hero, #0f172a); color: #fff; padding: 4rem 2rem; }
  .press-inner { max-width: 960px; margin: 0 auto; }
  .press-breadcrumb { font-size: 0.875rem; opacity: 0.7; margin-bottom: 1.5rem; }
  .press-breadcrumb a { color: inherit; text-decoration: none; }
  .press-title { font-size: 2rem; font-weight: 700; margin: 0 0 0.75rem; line-height: 1.25; }
  .press-intro { margin: 0 0 1.5rem; max-width: 640px; opacity: 0.9; }
  .press-btn {
    display: inline-block; background: var(--color-accent-dark, #ea580c); color: #fff;
    padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none;
  }
  .press-btn:hover { background: var(--color-accent, #f97316); }
  a:focus-visible { outline: 3px solid var(--color-focus, #1e40af); outline-offset: 2px; }
  .press-hero a:focus-visible { outline-color: #fff; }
  .press-body { padding: 3rem 2rem; background: var(--color-bg-primary, #fff); }
  .press-section { margin-bottom: 2.5rem; }
  h2 { font-size: 1.375rem; margin: 0 0 1rem; color: var(--color-text-primary, #1e293b); }
  h3 { font-size: 1.0625rem; margin: 1.25rem 0 0.5rem; color: var(--color-text-primary, #1e293b); }
  .press-body a { color: var(--color-primary, #1e40af); }
  .logo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .logo-card { margin: 0; border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px; overflow: hidden; }
  .logo-preview { display: flex; justify-content: center; padding: 2rem; background: #fff; }
  .logo-preview.on-dark { background: var(--color-bg-hero, #0f172a); }
  .logo-preview img { max-width: 100%; height: auto; }
  figcaption { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem; color: var(--color-text-secondary, #475569); }
  .logo-links { display: flex; gap: 1rem; }
  .usage { color: var(--color-text-secondary, #475569); line-height: 1.7; padding-left: 1.25rem; }
  .swatches { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .swatch { display: flex; align-items: center; gap: 0.75rem; }
  .chip { width: 2rem; height: 2rem; border-radius: 6px; border: 1px solid var(--color-border-dark, #cbd5e1); flex: none; }
  .swatch-name { min-width: 10rem; color: var(--color-text-secondary, #475569); }
  .bp-card { border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.75rem; }
  .bp-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .bp-card p { margin: 0.5rem 0 0; line-height: 1.7; color: var(--color-text-secondary, #475569); }
  .shots { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
  .shots a { display: block; text-decoration: none; font-size: 0.875rem; }
  .shots img { width: 100%; height: 130px; object-fit: cover; border: 1px solid var(--color-border, #e2e8f0); border-radius: 6px; }
  .back-link a { text-decoration: none; }
</style>
