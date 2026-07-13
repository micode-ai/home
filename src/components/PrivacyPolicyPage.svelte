<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';

  const lang = $derived($languageStore);

  const companyName = $derived(t('header.companyName', lang));
  const backLabel = $derived(t('blog.backToMicode', lang));
  const title = $derived(t('legal.privacyPolicy.title', lang));

  const sections = $derived([
    { heading: t('legal.privacyPolicy.controller', lang), body: t('legal.privacyPolicy.controllerText', lang) },
    { heading: t('legal.privacyPolicy.dataCollected', lang), body: t('legal.privacyPolicy.dataCollectedText', lang) },
    { heading: t('legal.privacyPolicy.legalBasis', lang), body: t('legal.privacyPolicy.legalBasisText', lang) },
    { heading: t('legal.privacyPolicy.retention', lang), body: t('legal.privacyPolicy.retentionText', lang) },
    { heading: t('legal.privacyPolicy.rights', lang), body: t('legal.privacyPolicy.rightsText', lang) },
    { heading: t('legal.privacyPolicy.cookies', lang), body: t('legal.privacyPolicy.cookiesText', lang) },
  ]);

  const contactTitle = $derived(t('legal.privacyPolicy.contactTitle', lang));
  const contactEmail = $derived(t('legal.privacyPolicy.contactText', lang));
</script>

<article class="privacy-page" aria-labelledby="privacy-title">
  <div class="privacy-hero">
    <div class="privacy-inner">
      <nav class="privacy-breadcrumb" aria-label="Breadcrumb">
        <a href={withLocale('/', lang)}>{companyName}</a>
      </nav>
      <h1 id="privacy-title" class="privacy-title">{title}</h1>
    </div>
  </div>
  <div class="privacy-body">
    <div class="privacy-inner">
      {#each sections as section}
        <section class="privacy-section">
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      {/each}

      <section class="privacy-section">
        <h2>{contactTitle}</h2>
        <p><a href="mailto:{contactEmail}">{contactEmail}</a></p>
      </section>

      <div class="back-link">
        <a href={withLocale('/', lang)}>{backLabel}</a>
      </div>
    </div>
  </div>
</article>

<style>
  .privacy-hero {
    background: var(--color-bg-hero, #0f172a);
    color: #fff;
    padding: 4rem 2rem;
  }
  .privacy-inner { max-width: 720px; margin: 0 auto; }
  .privacy-breadcrumb { font-size: 0.875rem; opacity: 0.7; margin-bottom: 1.5rem; }
  .privacy-breadcrumb a { color: inherit; text-decoration: none; }
  .privacy-breadcrumb a:hover { text-decoration: underline; }
  .privacy-title { font-size: 2rem; font-weight: 700; margin: 0; line-height: 1.25; }

  .privacy-body { padding: 3rem 2rem; background: var(--color-bg-primary, #fff); }
  .privacy-section { margin-bottom: 1.75rem; }
  .privacy-section:last-of-type { margin-bottom: 0; }
  .privacy-section h2 {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--color-text-primary, #1e293b);
  }
  .privacy-section p {
    margin: 0;
    line-height: 1.8;
    color: var(--color-text-secondary, #475569);
  }
  .privacy-section a {
    color: var(--color-primary, #1e3a8a);
    text-decoration: underline;
  }

  .back-link { margin-top: 2.5rem; }
  .back-link a { color: var(--color-primary, #1e3a8a); text-decoration: none; }
  .back-link a:hover { text-decoration: underline; }
</style>
