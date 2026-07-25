<script lang="ts">
  import { t } from '../services/i18n';
  import {
    computeAgentCost,
    COST_COMPONENTS,
    DAYS_PER_MONTH,
    MODEL_IDS,
    PRICES_SNAPSHOT_DATE,
    type CostComponent,
    type CostInputs,
    type ModelId,
  } from '../services/agentCost';

  let { lang }: { lang: string } = $props();

  // Defaults describe the reference configuration from the article's assumptions table:
  // a tool-heavy agent doing multi-step work. They are assumptions, not measurements.
  let tools = $state(80);
  let tokensPerToolSchema = $state(180);
  let systemPromptTokens = $state(1200);
  let historyTokens = $state(2000);
  // Non-zero on purpose: the stacked bar filters empty components out, and a five-series
  // chart is part of the spec. It is also the realistic case for a retrieval-backed agent.
  let ragTokens = $state(1500);
  let outputTokensPerStep = $state(300);
  let stepsMin = $state(4);
  let stepsMax = $state(12);
  let tasksPerDay = $state(50);
  let cachedSharePct = $state(0);
  let model = $state<ModelId>('gpt-5.4-mini');
  let euResidency = $state(false);

  const inputs = $derived<CostInputs>({
    tools, tokensPerToolSchema, systemPromptTokens, historyTokens, ragTokens,
    outputTokensPerStep, stepsMin, stepsMax, tasksPerDay,
    cachedShare: cachedSharePct / 100,
    model, euResidency,
  });

  const result = $derived(computeAgentCost(inputs));

  const usd = (v: number) => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const label = (c: CostComponent) => t(`costCalc.comp.${c}`, lang);
</script>

<section class="calc" aria-labelledby="calc-title">
  <h3 id="calc-title" class="calc-title">{t('costCalc.title', lang)}</h3>
  <p class="calc-intro">{t('costCalc.intro', lang)}</p>

  <div class="calc-grid">
    <label>{t('costCalc.tools', lang)}<input type="number" min="0" bind:value={tools} /></label>
    <label>{t('costCalc.tokensPerToolSchema', lang)}<input type="number" min="0" bind:value={tokensPerToolSchema} /></label>
    <label>{t('costCalc.systemPromptTokens', lang)}<input type="number" min="0" bind:value={systemPromptTokens} /></label>
    <label>{t('costCalc.historyTokens', lang)}<input type="number" min="0" bind:value={historyTokens} /></label>
    <label>{t('costCalc.ragTokens', lang)}<input type="number" min="0" bind:value={ragTokens} /></label>
    <label>{t('costCalc.outputTokensPerStep', lang)}<input type="number" min="0" bind:value={outputTokensPerStep} /></label>
    <label>{t('costCalc.stepsMin', lang)}<input type="number" min="1" bind:value={stepsMin} /></label>
    <label>{t('costCalc.stepsMax', lang)}<input type="number" min="1" bind:value={stepsMax} /></label>
    <label>{t('costCalc.tasksPerDay', lang)}<input type="number" min="0" bind:value={tasksPerDay} /></label>
    <label>{t('costCalc.cachedShare', lang)}<input type="number" min="0" max="100" bind:value={cachedSharePct} /></label>
    <label>{t('costCalc.model', lang)}
      <select bind:value={model}>
        {#each MODEL_IDS as id}<option value={id}>{id}</option>{/each}
      </select>
    </label>
    <label class="calc-check">
      <input type="checkbox" bind:checked={euResidency} />
      {t('costCalc.euResidency', lang)}
    </label>
  </div>

  <p class="calc-result">
    <span class="calc-result-label">{t('costCalc.resultTitle', lang)}</span>
    <span class="calc-range">
      <span data-testid="monthly-low">{usd(result.low.monthly)}</span>
      <span aria-hidden="true"> — </span>
      <span data-testid="monthly-high">{usd(result.high.monthly)}</span>
    </span>
  </p>
  <p class="calc-note">{t('costCalc.perTask', lang)}: {usd(result.low.perTask)} — {usd(result.high.perTask)}</p>
  <p class="calc-note">{t('costCalc.rangeNote', lang)}</p>

  <h4 class="calc-subtitle">{t('costCalc.breakdownTitle', lang)}</h4>

  <div class="calc-table-wrap">
    <table class="calc-table">
      <thead>
        <tr>
          <th scope="col">{t('costCalc.componentHeader', lang)}</th>
          <th scope="col">{t('costCalc.costHeader', lang)}</th>
          <th scope="col">{t('costCalc.shareHeader', lang)}</th>
        </tr>
      </thead>
      <tbody>
        {#each COST_COMPONENTS as c}
          <tr>
            <td>{label(c)}</td>
            <td>{usd(result.low.components[c])}</td>
            <td>{pct(result.low.components[c], result.low.monthly)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="calc-note">{t('costCalc.priceNote', lang).replace('{date}', PRICES_SNAPSHOT_DATE)}</p>
  <p class="calc-note">{t('costCalc.monthNote', lang).replace('{days}', String(DAYS_PER_MONTH))}</p>
</section>

<style>
  .calc {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-xl, 12px);
  }
  .calc-title { font-size: 1.2rem; font-weight: 700; margin: 0 0 0.5rem; color: var(--color-text-primary, #1e293b); }
  .calc-subtitle { font-size: 1rem; font-weight: 700; margin: 1.75rem 0 0.75rem; color: var(--color-text-primary, #1e293b); }
  .calc-intro { font-size: 0.9375rem; margin: 0 0 1.25rem; color: var(--color-text-secondary, #475569); }
  .calc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; }
  .calc-grid label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8125rem; color: var(--color-text-secondary, #475569); }
  .calc-grid input[type="number"], .calc-grid select {
    min-height: 44px;
    padding: 0.4rem 0.6rem;
    font: inherit;
    color: var(--color-text-primary, #1e293b);
    background: var(--color-bg-primary, #fff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
  }
  .calc-check { flex-direction: row !important; align-items: center; gap: 0.5rem; min-height: 44px; }
  .calc-result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.75rem; margin: 1.5rem 0 0.25rem; }
  .calc-result-label { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary, #475569); }
  .calc-range { font-size: 1.6rem; font-weight: 700; color: var(--color-text-primary, #1e293b); }
  .calc-note { font-size: 0.8125rem; margin: 0.35rem 0 0; color: var(--color-text-secondary, #475569); }
  .calc-table-wrap { overflow-x: auto; }
  .calc-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .calc-table th, .calc-table td { padding: 0.5rem 0.6rem; text-align: left; border-bottom: 1px solid var(--color-border, #e2e8f0); color: var(--color-text-primary, #1e293b); }
</style>
