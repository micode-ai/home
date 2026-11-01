<script lang="ts">
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { withLocale } from '../services/locale';
  import { getIndustry, loc, ctaHref, industryJsonLd, uiLabels } from '../services/industries';
  import { track } from '../services/tracking';
  import products from '../data/products.json';

  let { industryId }: { industryId: string } = $props();

  const lang = $derived($languageStore);
  const industry = $derived(getIndustry(industryId));
  const cards = $derived(
    industry
      ? industry.productIds
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is (typeof products)[number] => Boolean(p))
      : []
  );

  // Emitted in-body so the prerender bakes one copy per locale (valid anywhere in the document).
  const jsonLd = $derived(
    industry
      ? industryJsonLd(industry, lang)
          .map(
            (node) =>
              `<script type="application/ld+json">${JSON.stringify(node).replace(/</g, '\\u003c')}<\/script>`
          )
          .join('')
      : ''
  );
</script>

{#if industry}
  {@html jsonLd}
  <article class="industry" aria-labelledby="industry-title">
    <header class="hero">
      <div class="inner">
        <nav class="crumb" aria-label="Breadcrumb">
          <a href={withLocale('/', lang)}>{t('header.companyName', lang)}</a>
        </nav>
        <h1 id="industry-title">{loc(industry.title, lang)}</h1>
        <p class="lead">{loc(industry.heroLead, lang)}</p>
        <a
          class="cta"
          href={ctaHref(industry, lang)}
          onclick={() => track('industry_cta_click', { industry: industry.id, position: 'hero' })}
        >{loc(industry.ctaLabel, lang)}</a>
      </div>
    </header>

    <section class="block" aria-labelledby="pain-title">
      <div class="inner">
        <h2 id="pain-title">{loc(uiLabels.painPoints, lang)}</h2>
        <ul class="grid">
          {#each industry.painPoints as p}
            <li class="card">
              <h3>{loc(p.title, lang)}</h3>
              <p>{loc(p.body, lang)}</p>
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <section class="block alt" aria-labelledby="products-title">
      <div class="inner">
        <h2 id="products-title">{loc(uiLabels.products, lang)}</h2>
        <ul class="grid">
          {#each cards as p (p.id)}
            <li class="card">
              <h3>{t(p.nameKey, lang)}</h3>
              <p>{loc((industry.useCases as Record<string, any>)[p.id], lang)}</p>
              <a class="more" href={withLocale(`/products/${p.id}/`, lang)}>{loc(uiLabels.viewProduct, lang)} →</a>
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <section class="block" aria-labelledby="scenario-title">
      <div class="inner">
        <h2 id="scenario-title">{loc(industry.scenario.title, lang)}</h2>
        <p class="scenario">{loc(industry.scenario.body, lang)}</p>
      </div>
    </section>

    <section class="block alt" aria-labelledby="ind-faq-title">
      <div class="inner">
        <h2 id="ind-faq-title">{loc(uiLabels.faq, lang)}</h2>
        {#each industry.faq as f}
          <details class="faq-item">
            <summary>{loc(f.q, lang)}</summary>
            <p>{loc(f.a, lang)}</p>
          </details>
        {/each}
        <a
          class="cta"
          href={ctaHref(industry, lang)}
          onclick={() => track('industry_cta_click', { industry: industry.id, position: 'faq' })}
        >{loc(industry.ctaLabel, lang)}</a>
      </div>
    </section>
  </article>
{:else}
  <p class="not-found">{loc(uiLabels.notFound, lang)}</p>
{/if}

<style>
  .inner { max-width: 960px; margin: 0 auto; padding: 0 2rem; }
  .hero { background: var(--color-bg-hero, #0f172a); color: #fff; padding: 4rem 0; }
  .crumb { font-size: 0.875rem; opacity: 0.7; margin-bottom: 1.5rem; }
  .crumb a { color: inherit; text-decoration: none; }
  h1 { font-size: 2.25rem; line-height: 1.2; margin: 0 0 1rem; }
  .lead { font-size: 1.125rem; line-height: 1.7; max-width: 62ch; opacity: 0.9; margin: 0 0 2rem; }
  .cta {
    display: inline-block; padding: 0.8rem 1.5rem; border-radius: var(--radius-md, 0.5rem);
    background: var(--color-primary, #3b82f6); color: #fff; font-weight: 600; text-decoration: none;
  }
  .cta:hover, .cta:focus-visible { filter: brightness(1.1); }
  .block { padding: 3rem 0; background: var(--color-bg-primary, #fff); color: var(--color-text-primary, #0f172a); }
  .block.alt { background: var(--color-bg-secondary, #f8fafc); }
  h2 { font-size: 1.5rem; margin: 0 0 1.5rem; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .card { padding: 1.25rem; border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 0.5rem); background: var(--color-bg-primary, #fff); }
  .card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; }
  .card p { margin: 0 0 0.75rem; line-height: 1.6; }
  .more { font-weight: 600; text-decoration: none; color: var(--color-primary, #3b82f6); }
  .scenario { line-height: 1.75; max-width: 70ch; margin: 0; }
  .faq-item { border-bottom: 1px solid var(--color-border, #e2e8f0); padding: 0.75rem 0; }
  .faq-item summary { cursor: pointer; font-weight: 600; }
  .faq-item p { margin: 0.5rem 0 0; line-height: 1.6; }
  .block .cta { margin-top: 1.5rem; }
  .not-found { padding: 4rem 2rem; text-align: center; }
</style>
